export default function idToTimestamp(i) {
	const n = i.replace(/[a-z]/g, '');
	const l = r.toString().length;
	const f = parseInt(
		d3
			.range(l)
			.map(d => 9)
			.join(''),
		10
	);

	const m = f - n;
	return m;
}
