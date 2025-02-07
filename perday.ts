import { initDb } from './db.ts'

const db = await initDb()

let authors = await db
		.selectFrom('posts')
		.select('author')
		.distinct()
		.execute();
authors = authors.map(e => e.author)

let vals = []

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
console.log(vals.slice(0, top10), vals.slice(top10))

const newFeed = await db
		.selectFrom('posts')
		.selectAll()
		.orderBy('indexedAt', 'desc')
		.orderBy('cid', 'desc')
		.where('posts.author', 'not in', vals.slice(0, top10))
		.execute()
