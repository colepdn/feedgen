import express from 'express'
import { jwt } from './utils.ts'
import { initDb } from './db.ts'
const app = express()
const port = 3000

const db = await initDb()

//https://feedgen.hotgoth.mom/xrpc/app.bsky.feed.getFeedSkeleton?feed=at://did:plc:wl4wyug27klcee5peb3xkeut/app.bsky.feed.generator/boner

app.get('/.well-known/did.json', async (_req, res) => {
	const HOSTNAME = "feedgen.hotgoth.mom"
	res.status(200)
	res.json({
			"@context":["https://www.w3.org/ns/did/v1"],
			id: `did:web:${HOSTNAME}`,
			service: [
				{
					id:"#bsky_fg",
					type:"BskyFeedGenerator",
					serviceEndpoint:`https://${HOSTNAME}`
				}
			]}
		)
})

app.get('/xrpc/app.bsky.feed.getFeedSkeleton', async (req, res) => {
	console.log('req', req)
	console.log('query', req.query)
	const params = req.query
	const token = req.headers.authorization
	console.log('token', token)
	if (token && token.includes("Bearer")) {
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

		res.status(200)
		res.json({
			feed,
			cursor
		})
		return
	}

	//unauthenticated
	res.status(200)
	res.json({
		cursor: undefined,
		feed: [
			{
				post: "at://did:plc:o4apmr7gkxfbmwjnxv26drrb/app.bsky.feed.post/3lh7fayv6ks2w"
			}
		]
	})
})

app.listen(port, () => {
	console.log(`listening on ${port}`)
})

