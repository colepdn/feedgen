import { 
	Kysely,
	SqliteDialect	
} from "kysely"
import SqliteDb from "better-sqlite3"

export interface PostTable {
  uri: string
  cid: string
  indexedAt: string
  author: string
  media: 1 | 0
  nudity: 1 | 0
  usersFor: string
}

interface Database {
  posts: PostTable
}

export async function initDb(location = 'posts.db'): Promise<Kysely<Database>> {
	const db = new Kysely<Database>({
		dialect: new SqliteDialect({
			database: new SqliteDb(location),
		}),
	})

	await db.schema
	  .createTable('posts')
	  .ifNotExists()
	  .addColumn('uri', 'varchar', (col) => col.primaryKey())
	  .addColumn('cid', 'varchar', (col) => col.notNull())
	  .addColumn('indexedAt', 'varchar', (col) => col.notNull())
	  .addColumn('author', 'varchar', (col) => col.notNull())
	  .addColumn('media', 'integer', (col) => col.notNull())
	  .addColumn('nudity', 'integer', (col) => col.notNull())
	  .addColumn('usersFor', 'text', col => col.defaultTo('[]'))
	  .execute()

	return db
}

/*
const newPost = {
  uri: 'at://example.com/post/123',
  cid: 'bafyreidrmjljkfdl...',
  indexedAt: new Date().toISOString(), // ISO format string
  author: 'did:example:alice',
  media: 1
}

const result = await db
	.insertInto('posts')
	.values(newPost)
	.onConflict(oc => oc
		    .column('uri')
		    .doUpdateSet(newPost)
		   )
	.execute()

console.log(result)

const posts = await db
	.selectFrom('posts')
	.selectAll()
	.execute()

console.log(posts)
*/
