import { XRPC, CredentialManager } from '@atcute/client'
import { initDb } from './db.ts'
import type { PostTable } from './db.ts'
import { insert, getFollows, getReducedFollows, authorFeed } from "./cron/utils.ts"
import { time } from "./utils.ts"
import 'dotenv/config'

const manager = new CredentialManager({ service: process.env.BSKY_SERVICE })
const rpc = new XRPC({ handler: manager })

await manager.login({ identifier: process.env.BSKY_HANDLE, password: process.env.BSKY_PASSWORD })

console.log(manager.session)

// this will break if enough users like the feed to paginate
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
	let startHour = time()[1] < 10
	console.log(startHour ? "Start of the hour, fetching all follows." : "Fetching follows who've posted today.")
	let follows = startHour ? await getFollows(item.actor.did, rpc) : await getReducedFollows(item.actor.did, db)
	if (follows.length === 0 && !startHour) {
		console.log("No follows fetched, getting all follows...")
		follows = await getFollows(item.actor.did, rpc)
	}
	console.log('done! len:', follows.length)

	/*
	let count = 0
	for (const follow of follows){
		if (count % 20 == 0) console.log(`${Math.floor((count/follows.length)* 100)}%: ${follow.did}`)
		count++
		await authorFeed(rpc, follow.did, item.actor.did, uris, newPosts)
	}
	*/

	let promises: Promise<any>[] = []
	for (const follow of follows) {
		promises.push(authorFeed(rpc, follow.did, item.actor.did, uris, newPosts))
	}

	const CONCURRENT_AMT = 20 
	while (promises.length) {
		// this might not work the way we deal with uris[] and newPosts[]
		await Promise.all(promises.slice(0, CONCURRENT_AMT))
		promises = promises.slice(CONCURRENT_AMT)
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
