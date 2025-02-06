import type { initDb } from "../db.ts"

export const name = "media"

export default { name, handler}

export async function handler(db: Awaited<ReturnType<typeof initDb>>, params: any, token: string) {

}
