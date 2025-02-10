import { initDb } from "../db.ts"
export const name = "topten"

export default { name, handler }

type Tdb = Awaited<ReturnType<typeof initDb>>;

export async function handler(db: Tdb, userDid: string, params, limit: number) {
	
	// we should be calculated upon the initial request and cached for the cursor requests but right now i'm too tired/lazy to implement this! so calc every time we go. i just want you to work.
	let res = await db
			.selectFrom('posts')
			.select('author')
			.distinct()
			.execute();
	const authors = res.map(e => e.author)

	let vals: [string, number][] = []

	for (const author of authors) {
					// 	seconds in a week -> ms
		const startWeek = new Date(Date.now() - 604800 * 1000).toISOString()  
		const posts = await db
				.selectFrom('posts')
				.selectAll()
				.orderBy('indexedAt', 'desc')
				.orderBy('cid', 'desc')
				.where('posts.author', '=', author)
				.where('posts.indexedAt', '>', startWeek)
				.execute()
		vals.push([author, posts.length])
	}

	vals.sort((a, b) => b[1] - a[1])
	const top10 = vals.length - Math.floor(vals.length - vals.length * .1)
	//console.log(vals.slice(0, top10), vals.slice(top10))
	
	console.log(vals.slice(0, top10), vals.slice(top10))

	const scoundrels = vals.slice(0, top10).map(e => e[0])
	console.log('excluding', scoundrels)

	let builder = db 
		.selectFrom('posts')
		.selectAll()
		.orderBy('indexedAt', 'desc')
		.orderBy('cid', 'desc')
		.where('posts.author', 'not in', scoundrels)
		.limit(limit)

	if (params.cursor) {
		const timeStr = new Date(parseInt(params.cursor as string, 10)).toISOString()
		builder = builder.where('posts.indexedAt', '<', timeStr)
	}

	return await builder.execute()
}

