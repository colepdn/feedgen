export function jwt(token: string) {
	const spl = token.split("Bearer ")[1].split(".")
	return [JSON.parse(atob(spl[0])), JSON.parse(atob(spl[1]))]
}


// returns [hours, minutes] in current tz
export function time(): [number, number] {
	const d = new Date()
	return [d.getHours(), d.getMinutes()]
}

