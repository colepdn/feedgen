import { initDb } from './db.ts'

const db = await initDb()

const authors = await db
		.selectFrom('posts')
		.select('author')
		.distinct()
		.execute();
console.log(authors.map(e => e.author))

for (const author of authors) {
	const startWeek = 
	const posts = await db
			.selectFrom('posts')
			.selectAll()
			.orderBy('indexedAt', 'desc')
			.orderBy('cid', 'desc')
			.where('posts.indexedAt', > 
}
