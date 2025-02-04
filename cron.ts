import { XRPC, CredentialManager } from '@atcute/client'
import Database from 'better-sqlite3'
const db = new Database()
import 'dotenv/config'

const manager = new CredentialManager({ service: process.env.BSKY_SERVICE })
const rpc = new XRPC({ handler: manager })

await manager.login({ identifier: process.env.BSKY_HANDLE, password: process.env.BSKY_PASSWORD })

console.log(manager.session)

const { data } = await rpc.get('app.bsky.feed.getLikes', {
	params: {
		uri: ""
	},
});

console.log(data)
