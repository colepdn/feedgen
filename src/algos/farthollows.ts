import type { initDb } from "../db.ts"
import cache from "../cache.ts"

export const name = "artfollows"

export default { name, handler}

type Tdb = Awaited<ReturnType<typeof initDb>>;

export async function handler(db: Tdb, userDid, params, limit, rpc) {	
	const MYDID = "did:plc:wl4wyug27klcee5peb3xkeut"

	const getList = async () => {
		let items = []
		let cursor = null
		while (cursor !== undefined) {
			const { data } = await rpc.get('app.bsky.graph.getList', {
				params: {
					list: "at://did:plc:wl4wyug27klcee5peb3xkeut/app.bsky.graph.list/3lczyx7hr2l2t",
					cursor: cursor === null ? undefined : cursor
				}
			})
			cursor = data.cursor
			items = items.concat(data.items)
		}

		return items
	}
	
					// 	60 minutes
	const listMembers = await cache(name, 60 * 60 * 1000, getList)
	console.log(listMembers)
	const dids = listMembers.map(e => e.subject.did)

	console.log(dids)

	let builder = db
		.selectFrom('posts')
		.selectAll()
		.orderBy('indexedAt', 'desc')
		.orderBy('cid', 'desc')
		.where('posts.usersFor', 'like', `%${MYDID}%`)
		.where('posts.media', '=', '1')
		.where('posts.author', 'in', dids)
		.limit(limit)

	if (params.cursor) {
		const timeStr = new Date(parseInt(params.cursor as string, 10)).toISOString()
		builder = builder.where('posts.indexedAt', '<', timeStr)
	}

	const posts = await builder.execute()

	return posts
}
