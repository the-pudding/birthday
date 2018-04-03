import $ from './dom';
import calculateOdds from './calculate-odds';

const RADIUS = 3;
const SECOND = 1000;
const REM = 16;
const FONT_SIZE = 12;
const MARGIN = REM;
const TEXT_HEIGHT = 48;
const EASE = d3.easeCubicInOut;

let playerW = 32;

let width = 0;
const height = 10 * REM;

let data = null;
const scale = { x: d3.scaleLinear() };

function formatInt(num) {
	return d3.format(',d')(num);
}

function formatPercent(num) {
	const percent = d3.format('.1%')(num / 100);
	return percent === '100.0%' ? '> 99.9%' : percent;
}

function makeArc({ diam, fraction }) {
	return `M0,0 A${diam / 2},${diam / fraction} 0 0,1 ${diam},0`;
}

function clear() {
	$.mathInfo.selectAll('.values p').text(0);
}

function update(players) {
	$.svgMath.selectAll('path').remove();
	data = [];
	const len = players.length;
	const delay = len < 5 ? 1000 : 250;
	players.forEach((a, i) => {
		players
			.slice(i + 1)
			.forEach(b =>
				data.push({ start: a.day, end: b.day, delay: (i + 1) * delay })
			);
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
			const diam = scale.x(diff) - playerW / 2;
			const fraction = Math.max(2, diam / (height - TEXT_HEIGHT));
			const arc = makeArc({ diam, fraction });

			$path.at('d', arc);
			const totalLength = $path.node().getTotalLength();
			$path
				.at('stroke-dasharray', `${totalLength} ${totalLength}`)
				.at('stroke-dashoffset', totalLength * 1)
				.transition()
				.duration(SECOND)
				.delay(d.delay)
				.ease(EASE)
				.at('stroke-dashoffset', 0);
		});

	const odds = calculateOdds(players.length);

	$.mathInfo
		.select('.people--value')
		.transition()
		.duration(SECOND)
		.tween('text', (d, i, n) => {
			const $v = d3.select(n[i]);
			const terp = d3.interpolateNumber($v.text(), players.length);
			return t => $v.text(formatInt(terp(t)));
		});

	$.mathInfo
		.select('.comparisons--value')
		.transition()
		.duration(SECOND)
		.tween('text', (d, i, n) => {
			const $v = d3.select(n[i]);
			const terp = d3.interpolateNumber($v.text(), data.length);
			return t => $v.text(formatInt(terp(t)));
		});

	$.mathInfo
		.select('.probability--value')
		.transition()
		.duration(SECOND)
		.tween('text', (d, i, n) => {
			const $v = d3.select(n[i]);
			const terp = d3.interpolateNumber($v.text().replace('%', ''), odds * 100);
			return t => $v.text(formatPercent(terp(t)));
		});
}

function resize(p) {
	playerW = p.playerW;
	width = $.graphicChart.node().offsetWidth;
	scale.x.range([playerW / 2, width - playerW / 2]);
}

function setup() {
	scale.x.domain([0, 365]);
	const textData = ['people', 'comparisons', 'probability'];

	textData.forEach(t => {
		$.mathInfo
			.select('.labels')
			.append(`p.${t}--label`)
			.text(t);
		$.mathInfo
			.select('.values')
			.append(`p.${t}--value`)
			.text(0);
	});
}
export default { setup, resize, update, clear };
