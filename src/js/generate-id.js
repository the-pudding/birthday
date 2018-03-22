export default function generateID() {
	const alphabet = 'abcdefghijklmnopqrstuvwxyz';
	const m = new Date().getTime();
	const l = m.toString().length;
	const f = parseInt(
		d3
			.range(l)
			.map(d => 9)
			.join(''),
		10
	);
	const n = f - m;
	const str = d3
		.range(5)
		.map(d => {
			const i = Math.floor(Math.random() * alphabet.length);
			return alphabet[i];
		})
		.join('');
	const newID = `${n}${str}`;
	return newID;
}
