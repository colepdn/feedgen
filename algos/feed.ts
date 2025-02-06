import { jwt } from "../utils.ts"
import { initDb } from "../db.ts"

export const name = "feed"

export default { name, handler }

export async function handler(db: Awaited<ReturnType<typeof initDb>>, params: any, token: string) {
	let limit = parseInt((params.limit as string | undefined) ?? "50")
	limit = isNaN(limit) ? 50 : limit
	console.log('decoded', jwt(token))
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

	const posts = await builder.execute()

	const feed = posts.map((row) => ({
		post: row.uri
	}))

	let cursor: string | undefined
	const last = posts.at(-1)
	if (last) {
		cursor = new Date(last.indexedAt).getTime().toString(10)
	}

	return {
		feed,
		cursor
	}
}

