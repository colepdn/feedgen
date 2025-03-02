import type { XRPC } from "@atcute/client"
import { sql } from "kysely"
import type { initDb, PostTable} from "../db.ts"

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
	
	const a = newPosts.length
	const b = a - count 

	console.log(`inserted ${count} rows. waste: ${b}/${a}, ${Math.floor((b / a) * 100)}%`)

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
	//console.log(res.slice(0,5), res.length)
	console.log(`retrieved ${res.length} follows`)
	return res.map(e => ({
		did: e.author,
	}))
}

export async function authorFeed(rpc, did: string, requesterDid: string, uris: string[], newPosts: PostTable[] ) {
	const { data: authorFeed } = await rpc.get('app.bsky.feed.getAuthorFeed', {
		params: {
			actor: did,
			filter: "posts_no_replies"
		}
	}).catch((e) => {
		console.log("getting author errored! returning empty. error:", e)
		return {} 
	})
	for (const post of authorFeed.feed ?? []) {
		const pp = post.post
		const a = post.reason?.['$type'] === 'app.bsky.feed.defs#reasonRepost'
		const b = pp.author.did !== did 
		if (post.reason?.['$type'] === 'app.bsky.feed.defs#reasonRepost' || pp.author.did !== did) {
			if (!a && b) console.log('skipping reasonless DID mismatch')
			continue;
		} else if (post.reason) console.log('post has reason, but is not repost:', post.post.reason);

		let media = pp.embed?.["$type"].includes("app.bsky.embed.video") || pp.embed?.["$type"].includes("app.bsky.embed.images")
		if (uris.includes(pp.uri)) {
			const index = uris.indexOf(pp.uri)
			const newArr = JSON.parse(newPosts[index].usersFor) ?? []
			console.log(newArr)
			if (!newArr.includes(requesterDid)) {
				newArr.push(requesterDid)
				newPosts[index].usersFor = JSON.stringify(newArr)
			}
		} else {
			const postnis = {
				uri: pp.uri,
				cid: pp.cid,
				indexedAt: pp.indexedAt,
				author: pp.author.did,
				media: media ? 1 : 0,
				usersFor: JSON.stringify([requesterDid])
			}
			newPosts.push(postnis)
			uris.push(pp.uri)
		}
	}

}
