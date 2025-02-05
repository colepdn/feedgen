import { XRPC, CredentialManager } from '@atcute/client'
import Database from 'better-sqlite3'
const db = new Database()
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

type Post = {
  uri: string
  cid: string
  indexedAt: string
  author: string // did
  media: boolean
}


for ( const item of data.likes ) {
	console.log(`${item.actor.handle}: ${item.actor.did}`)
	let follows = []
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

	for (const follow of follows.slice(0, 10)) {
		console.log(follow.did)
		const { data: authorFeed } = await rpc.get('app.bsky.feed.getAuthorFeed', {
			params: {
				actor: follow.did,
				filter: "posts_no_replies"
			}
		})
		console.log(authorFeed)
		for (const post of authorFeed.feed) {
			//console.log('p', post.post.record.text, 'r', post.reason)
			if (post.reason?.['$type'] === 'app.bsky.feed.defs#reasonRepost') {
				console.log('skipping... repost')
			}
			console.log(post.post.record.text)
		}
	}
	
}


/*
const { data: myFeed } = await rpc.get('app.bsky.feed.getAuthorFeed', {
	params: {
		actor: "did:plc:wl4wyug27klcee5peb3xkeut"
	}
})

console.log(myFeed) 
*/
