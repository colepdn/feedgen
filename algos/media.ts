import type { initDb } from "../db.ts"
import { jwt } from "../utils.ts"

export const name = "media"

export default { name, handler}

type Tdb = Awaited<ReturnType<typeof initDb>>;

export async function handler(db: Tdb, auth, params, limit) {
	const did = auth[1].iss
	let builder = db
		.selectFrom('posts')
		.selectAll()
		.orderBy('indexedAt', 'desc')
		.orderBy('cid', 'desc')
		.where('posts.usersFor', 'like', `%${did}%`)
		.where('posts.media', '=', '1')
		.limit(limit)

	if (params.cursor) {
		const timeStr = new Date(parseInt(params.cursor as string, 10)).toISOString()
		builder = builder.where('posts.indexedAt', '<', timeStr)
	}

	const posts = await builder.execute()

	return posts
}
