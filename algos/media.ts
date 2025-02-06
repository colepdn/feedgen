import type { initDb } from "../db.ts"
import { jwt } from "../utils.ts"

export const name = "media"

export default { name, handler}

export async function handler(db: Awaited<ReturnType<typeof initDb>>, params: any, token: string) {
	let limit = parseInt((params.limit as string | undefined) ?? "50")
	limit = isNaN(limit) ? 50 : limit
	const auth = jwt(token)
	const did = auth[1].iss
	console.log('decoded', jwt(token))
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

	// here, we probably just return posts. handle all this in a shared piece of code. cause we're just returning the uris from now on.

	console.log(posts.slice(0, 10))

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
