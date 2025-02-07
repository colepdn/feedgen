import express from 'express'
import { jwt } from './utils.ts'
import { initDb } from './db.ts'
import algos from "./algos/index.ts" // we have barrel files... but we don't have any of the problems! awesome!
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
	//console.log('req', req)
	console.log('query', req.query)
	const params = req.query
	const token = req.headers.authorization
	console.log('token', token)
	// app.bsky.feed.getFeedSkeleton?feed=at://did:plc:wl4wyug27klcee5peb3xkeut/app.bsky.feed.generator/feed&limit=30&cursor=1738809921823

	if (token && token.includes("Bearer")) {
		const feed = decodeURIComponent(req.url.split('/').at(-1) ?? "").split('/').at(-1).split('&')[0]
		console.log('feed', feed)
		let limit = parseInt((params.limit as string | undefined) ?? "50")
		limit = isNaN(limit) ? 50 : limit
		const auth = jwt(token)
		console.log('decoded', auth)
		
		const posts = await algos[feed](db, auth[1].iss, params, limit)
		console.log(posts.slice(0, 10))

		const resp = posts.map((row) => ({
			post: row.uri
		}))

		let cursor: string | undefined
		const last = posts.at(-1)
		if (last) {
			cursor = new Date(last.indexedAt).getTime().toString(10)
		}

		res.status(200)
		res.json({
			feed: resp,
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

