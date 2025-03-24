import feed from './feed.ts'
import media from './media.ts'
import percentile from './bottompercentile.ts'
import whattopten from './whattopten.ts'
import art from "./farthollows.ts"
import boobs from "./boobs.ts"

export default {
	[feed.name]: feed.handler,
	[media.name]: media.handler,
	[percentile.name]: percentile.handler,
	[whattopten.name]: whattopten.handler,
	[art.name]: art.handler,
	[boobs.name]: boobs.handler
}
