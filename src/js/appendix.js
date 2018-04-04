import $ from './dom';

const REM = 16;
const RADIUS = 3;

const scale = {
	guess: d3.scaleLinear()
};

let userGuess = 0;

function resize() {
	// scale.guess.range([0, width])
	// $.appendixGuess.selectAll('.guess').at
}

function updateGuess(g) {
	userGuess = g;
}

function setupGuess(data) {
	const clean = data.map(d => ({ ...d, key: +d.key }));
	const count = d3.sum(clean, d => d.value);
	const sum = d3.sum(clean, d => +d.key * d.value);
	const avg = Math.round(sum / count);

	const avgText = `Avg. Reader Guess: ${avg}`;
	const userText = `Your Guess: ${userGuess}`;

	clean.push({ key: avg, value: 0, special: avgText });
	clean.push({ key: userGuess, value: 1, special: userText });

	const margin = REM;
	const $svg = $.appendixGuess.append('svg');
	const $g = $svg.append('g');

	const min = 2;
	const max = 365;
	scale.guess.domain([min, max]);

	const $enter = $g
		.selectAll('.guess')
		.data(clean)
		.enter()
		.append('g.guess');
	$enter.append('circle').at({
		cx: 0,
		cy: 0,
		r: RADIUS
	});

	$enter.each((d, i, n) => {
		if (d.special) {
			const $text = d3.select(n[i]).append('text');
			$text.at('text-align', 'middle');
			$text.text(d.special);
		}
	});
}

function setup(rawData) {
	setupGuess(rawData.binnedGuess);
}

export default { resize, setup, updateGuess };
