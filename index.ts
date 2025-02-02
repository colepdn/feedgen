import express from 'express'
import { jwt } from './utils'
const app = express()
const port = 3000

https://feedgen.hotgoth.mom/xrpc/app.bsky.feed.getFeedSkeleton?feed=at://did:plc:wl4wyug27klcee5peb3xkeut/app.bsky.feed.generator/boner

app.get('/xrpc/app.bsky.feed.getFeedSkeleton', async (req, res) => {
	console.log('req', req)
	console.log('query', req.query)
	const token = req.headers.authorization
	console.log('token', token)
	if (false && token && token.includes("Bearer")) {
		console.log('decoded', jwt(req.headers.authorization)[1])
		res.status(200)
		// auth'd  
		res.json({
			cursor: undefined,
			feed: [
				{"post":"at://did:plc:vrsjep4z5wfph7q5j2tlxjf4/app.bsky.feed.post/3lgu2s7ty7s2m"}
			]
		})
		return
	}

	//unauthenticated
	res.status(200)
	res.json({
		cursor: undefined,
		feed: [
			//{"post":"at://did:plc:vrsjep4z5wfph7q5j2tlxjf4/app.bsky.feed.post/3lgu2s7ty7s2m"}
			{
				post: "at://did:plc:o4apmr7gkxfbmwjnxv26drrb/app.bsky.feed.post/3lh7fayv6ks2w"
			}
		]
	})
})

app.listen(port, () => {
	console.log(`listening on ${port}`)
})
