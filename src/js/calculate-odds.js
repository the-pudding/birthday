export default function calculateOdds(n) {
	const DAYS = 365;
	const odds = d3.range(n).reduce((prev, cur) => {
		const o = (DAYS - cur) / DAYS;
		return o * prev;
	}, 1);
	return 1 - odds;
}
