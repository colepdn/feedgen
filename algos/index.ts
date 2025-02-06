import feed from './feed.ts'
import media from './media.ts'

export default {
	[feed.name]: feed.handler,
	[media.name]: media.handler
}
