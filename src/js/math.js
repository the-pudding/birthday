import $ from './dom';
import calculateOdds from './calculate-odds';

const RADIUS = 3;
const SECOND = 1000;
const REM = 16;
const FONT_SIZE = 12;
const MARGIN = REM;
const PLAYER_W = 32;
const TEXT_HEIGHT = 48;
const EASE = d3.easeCubicInOut;

let width = 0;
const height = 10 * REM;

let data = null;
const scale = { x: d3.scaleLinear() };

function makeArc({ diam, fraction }) {
	return `M0,0 A${diam / 2},${diam / fraction} 0 0,1 ${diam},0`;
}

function update(players) {
	$.svgMath.selectAll('path').remove();
	data = [];
	players.forEach((a, i) => {
		players.slice(i + 1).forEach(b => data.push({ start: a.day, end: b.day }));
	});
	$.svgMath
		.selectAll('.arc')
		.data(data)
		.enter()
		.append('path.arc')
		.at('transform', d => `translate(${scale.x(d.start)}, ${height})`)
		.each((d, i, n) => {
			const $path = d3.select(n[i]);
			const diff = d.end - d.start;
			const diam = scale.x(diff) - PLAYER_W / 2;
			const fraction = Math.max(2, diam / (height - TEXT_HEIGHT));
			const arc = makeArc({ diam, fraction });

			$path.at('d', arc);
			const totalLength = $path.node().getTotalLength();
			$path
				.at('stroke-dasharray', `${totalLength} ${totalLength}`)
				.at('stroke-dashoffset', totalLength * 1)
				.transition()
				.duration(SECOND)
				.delay(i * 20)
				.ease(EASE)
				.at('stroke-dashoffset', 0);
		});

	const odds = calculateOdds(players.length);
	const oddsFormatted = d3.format('.1%')(odds);
	const oddsDisplay = oddsFormatted === '100.0%' ? '> 99.9%' : oddsFormatted;

	$.mathInfo.select('.people--value').text(players.length);
	$.mathInfo.select('.comparisons--value').text(data.length);
	$.mathInfo.select('.chance--value').text(oddsDisplay);
}

function resize() {
	width = $.graphicChart.node().offsetWidth;
	scale.x.range([PLAYER_W / 2, width - PLAYER_W / 2]);
}

function setup() {
	scale.x.domain([0, 365]);
	const textData = ['people', 'comparisons', 'chance'];

	textData.forEach(t => {
		$.mathInfo
			.select('.labels')
			.append(`p.${t}--label`)
			.text(t);
		$.mathInfo.select('.values').append(`p.${t}--value`);
	});
}
export default { setup, resize, update };
