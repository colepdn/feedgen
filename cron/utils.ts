import type { XRPC } from "@atcute/client"
import { sql } from "kysely"
import type { initDb } from "../db.ts"

export async function insert(db, posts) {
	let newPosts = posts.concat() //clone it just cause
	console.log('adding', newPosts.length, 'items to db')
	let count = 0

	while(newPosts.length) {
		const result = await db
			.insertInto('posts')
			.values(newPosts.slice(0,999))
			.onConflict(oc => oc.column('uri').doNothing())
			.execute()
		
		newPosts = newPosts.slice(999)
		console.log('result', result)
		count += Number(result[0].numInsertedOrUpdatedRows)
	}
	
	return count
}

export async function getFollows(did: string, rpc: XRPC) {
	let follows: any[] = []
	let cursor = null
	while (cursor !== undefined) {
		const { data: d } = await rpc.get("app.bsky.graph.getFollows", {
			params: {
				actor: did,
				//actor: "did:plc:mt74bxrck624eg4atq2cpgtg",
				cursor: cursor ?? undefined
			}
		})
		console.log(d.follows.length, d.cursor)
		follows = follows.concat(d.follows)
		cursor = d.cursor
	}

	return follows
}

/*
SELECT DISTINCT author
FROM posts
WHERE indexedAt >= datetime('now', '-7 days');
*/
				// we should use this but idrc rn
				// TODO: Fixme

type Tdb = Awaited<ReturnType<typeof initDb>>;
export async function getReducedFollows(_did: string, db: Tdb) {
	const res = await db
			.selectFrom('posts')
			.select('author')
			.distinct()
			.where('posts.indexedAt', '>=', sql`datetime('now', '-1 day')`)
			.execute()
	console.log(res.slice(0,5), res.length)
	return res.map(e => ({
		did: e.author,
	}))
}


