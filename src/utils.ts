export function jwt(token: string) {
	const spl = token.split("Bearer ")[1].split(".")
	return [JSON.parse(atob(spl[0])), JSON.parse(atob(spl[1]))]
}
