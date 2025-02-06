import { XRPC, CredentialManager } from '@atcute/client'
import { initDb } from './db.ts'
import type { PostTable } from './db.ts'
import 'dotenv/config'

const manager = new CredentialManager({ service: process.env.BSKY_SERVICE })
const rpc = new XRPC({ handler: manager })

await manager.login({ identifier: process.env.BSKY_HANDLE, password: process.env.BSKY_PASSWORD })

console.log(manager.session)

const { data } = await rpc.get('app.bsky.feed.getLikes', {
	params: {
		uri: "at://did:plc:wl4wyug27klcee5peb3xkeut/app.bsky.feed.generator/feed"
	},
});

const db = await initDb()

let newPosts: PostTable[] = []
const uris: string[] = []
const indices: number[] = []

for ( const item of data.likes ) {
	console.log(`${item.actor.handle}: ${item.actor.did}`)
	let follows: any[] = []
	let cursor = null
	while (cursor !== undefined) {
		const { data: d } = await rpc.get("app.bsky.graph.getFollows", {
			params: {
				actor: item.actor.did,
				//actor: "did:plc:mt74bxrck624eg4atq2cpgtg",
				cursor: cursor ?? undefined
			}
		})
		console.log(d.follows.length, d.cursor)
		follows = follows.concat(d.follows)
		cursor = d.cursor
	}
	console.log('done! len:', follows.length)

	for (const follow of follows){
		console.log(follow.did)
		const { data: authorFeed } = await rpc.get('app.bsky.feed.getAuthorFeed', {
			params: {
				actor: follow.did,
				filter: "posts_no_replies"
			}
		})
		//console.log(authorFeed)
		for (const post of authorFeed.feed) {
			const pp = post.post
			//console.log('p', post.post.record.text, 'r', post.reason)
			const a = post.reason?.['$type'] === 'app.bsky.feed.defs#reasonRepost'
			const b = pp.author.did !== follow.did 
			if (post.reason?.['$type'] === 'app.bsky.feed.defs#reasonRepost' || pp.author.did !== follow.did) {
				if (!a && b) console.log('skipping reasonless did mismatch')
				continue;
			} else if (post.reason) console.log('post has reason, not repost:', post.post.reason);

			let media = pp.embed?.["$type"].includes("app.bsky.embed.video") || pp.embed?.["$type"].includes("app.bsky.embed.images")
			if (uris.includes(pp.uri)) {
				const index = uris.indexOf(pp.uri)
				const newArr = JSON.parse(newPosts[index].usersFor) ?? []
				console.log(newArr)
				if (!newArr.includes(item.actor.did)) {
					newArr.push(item.actor.did)
					newPosts[index].usersFor = JSON.stringify(newArr)
				}
			} else {
				const postnis = {
					uri: pp.uri,
					cid: pp.cid,
					indexedAt: pp.indexedAt,
					author: pp.author.did,
					media: media ? 1 : 0,
					usersFor: JSON.stringify([item.actor.did])
				}
				newPosts.push(postnis)
				uris.push(pp.uri)
			}
		}
	}

}

for (let i = 0; i < uris.length; i++) {
	const uri = uris[i]
	if (uri !== newPosts[i].uri) console.log('mismatch!', uri, "!=", newPosts[i].uri)
}

console.log('adding', newPosts.length, 'items')

while(newPosts.length) {
	const result = await db
		.insertInto('posts')
		.values(newPosts.slice(0,999))
		.onConflict(oc => oc.column('uri').doNothing())
		.execute()
	
	newPosts = newPosts.slice(999)
	console.log('result', result)
}

console.log('done!')
