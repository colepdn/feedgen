type TCache = { [key: string]: [number, any] }

let cache: TCache = {}

export default async function(id: string, timeout_ms: number, fn: () => Promise<any>) {
	const now_ms = Date.now()
	if (cache[id] === undefined) return await uc(id, fn);
	if (cache[id][0] + timeout_ms > now_ms) {
		console.log(`returning cached result for ${id}`)
		return cache[id][1];
	}
	return await uc(id, fn)
}

async function uc(id: string, fn: () => Promise<any>) {
	console.log(`updating cache for ${id}`)
	const r = await fn()
	cache[id] = [Date.now(), r]
	return r
}
