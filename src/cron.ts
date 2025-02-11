import { XRPC, CredentialManager } from '@atcute/client'
import { initDb } from './db.ts'
import type { PostTable } from './db.ts'
import { insert, getFollows, getReducedFollows } from "./cron/utils.ts"
import { time } from "./utils.ts"
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

for (const item of data.likes) {
	console.log(`${item.actor.handle}: ${item.actor.did}`)
	let startHour = time()[1] === 0
	console.log(startHour ? "Start of the hour, fetching all follows." : "Fetching follows who've posted today.")
	let follows = startHour ? await getFollows(item.actor.did, rpc) : await getReducedFollows(item.actor.did, db)
	console.log('done! len:', follows.length)

	let count = 0
	for (const follow of follows){
		//console.log(follow)
		if (count % 20 == 0) console.log(`${Math.floor((count/follows.length)* 100)}%: ${follow.did}`)
		count++
		//console.log(follow.did)
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
				if (!a && b) console.log('skipping reasonless DID mismatch')
				continue;
			} else if (post.reason) console.log('post has reason, but is not repost:', post.post.reason);

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

const inserted = await insert(db, newPosts)
const a = newPosts.length
const b = a - inserted

console.log(`inserted ${inserted} rows. waste: ${b}/${a}, ${Math.floor((b / a) * 100)}%`)

console.log('done!')
