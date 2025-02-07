import feed from './feed.ts'
import media from './media.ts'
import percentile from './bottompercentile.ts'

export default {
	[feed.name]: feed.handler,
	[media.name]: media.handler,
	[percentile.name]: percentile.handler
}
