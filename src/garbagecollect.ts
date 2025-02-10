import { initDb } from './db.ts'
import algos from "./algos/index.ts"
import 'dotenv/config'

const db = await initDb()

for (const [name, handler] of Object.entries(algos)) {
	console.log('name:')
	const feed = await handler(db, "did:plc:wl4wyug27klcee5peb3xkeut", {}, 200)
	const last = feed.at(-1)
	console.log(last.indexedAt)
	const posts = await db
			.selectFrom('posts')
			.selectAll()
			.orderBy('indexedAt', 'desc')
			.orderBy('cid', 'desc')
			.where('posts.indexedAt', '<', last.indexedAt)
			.execute()

	console.log(posts.length)
}
