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
	console.log('req', req)
	console.log('query', req.query)
	const params = req.query
	const token = req.headers.authorization
	console.log('token', token)
	if (token && token.includes("Bearer")) {
		// app.bsky.feed.getFeedSkeleton?feed=at://did:plc:wl4wyug27klcee5peb3xkeut/app.bsky.feed.generator/feed&limit=30&cursor=1738809921823
		console.log(decodeURIComponent(req.url.split('/').at(-1) ?? "").split('/'))
		const resp = await algos.feed(db, params, token)
		res.status(200)
		res.json(resp)
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

