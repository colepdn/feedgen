import { jwt } from "../utils.ts"
import { initDb } from "../db.ts"
export const name = "feed"

export default { name, handler }

export async function handler(db: Tdb, userDid, params, limit) {
	let builder = db
		.selectFrom('posts')
		.selectAll()
		.orderBy('indexedAt', 'desc')
		.orderBy('cid', 'desc')
		.limit(limit)

	if (params.cursor) {
		const timeStr = new Date(parseInt(params.cursor as string, 10)).toISOString()
		builder = builder.where('posts.indexedAt', '<', timeStr)
	}

	return await builder.execute()
}

