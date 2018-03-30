import $ from './dom';

const RADIUS = 3;
const SECOND = 1000;
const REM = 16;
const FONT_SIZE = 12;
const MARGIN = { top: REM, bottom: REM * 3, left: REM * 3.25, right: REM };
const height = 10 * REM - MARGIN.top - MARGIN.bottom;
let width = 0;
const rawData = [];
let data = null;
const scale = { x: d3.scaleLinear(), y: d3.scaleLinear() };
const line = d3
	.line()
	.x((d, i) => scale.x(i))
	.y(d => scale.y(d));

function update(match) {
	rawData.push(match);
	// update success vals
	let total = 0;
	data = rawData.map((d, i) => {
		total += d ? 1 : 0;
		return total / (i + 1);
	});

	$.gTally
		.select('.g-line path')
		.datum(data)
		.at('d', line);

	$.gTally
		.select('.g-dots')
		.selectAll('circle')
		.data(data)
		.enter()
		.append('circle')
		.at('cx', (d, i) => scale.x(i))
		.at('cy', d => scale.y(d))
		.at('r', 1)
		.transition()
		.duration(SECOND * 0.5)
		.ease(d3.easeCubicInOut)
		.at('r', RADIUS);

	const successCount = rawData.filter(d => d).length;
	const failureCount = rawData.length - successCount;
	const successSuffix = successCount === 1 ? '' : 'es';
	const failureSuffix = failureCount === 1 ? '' : 's';
	$.gTally
		.selectAll('.success')
		.html(
			`<tspan class='count'>${successCount}</tspan> <tspan>success${successSuffix}</tspan>`
		);
	$.gTally
		.selectAll('.failure')
		.html(
			`<tspan class='count'>${failureCount}</tspan> <tspan>failure${failureSuffix}</tspan>`
		);
}

function matchFirst() {
	return rawData[0];
}

function resize() {
	const w = $.graphicUi.node().offsetWidth;
	width = w - MARGIN.left - MARGIN.right;
	scale.x.range([0, width]);
	scale.y.range([height, 0]);
	const $x = $.svgTally.select('.axis--x');
	$x.select('.label').at('transform', `translate(${width / 2}, 0)`);

	const axisX = d3.axisBottom().scale(scale.x);

	$x
		.call(axisX)
		.at('transform', `translate(${MARGIN.left},${MARGIN.top + height})`);

	const $y = $.svgTally.select('.axis--y');

	$y
		.select('.label')
		.at('transform', `rotate(-90) translate(${-height / 2}, 0)`);

	const axisY = d3
		.axisLeft()
		.scale(scale.y)
		.tickSize(-width)
		.tickPadding(FONT_SIZE / 2)
		.tickValues([0, 0.25, 0.5, 0.75, 1])
		.tickFormat(d3.format('.0%'));

	$y.call(axisY).at('transform', `translate(${MARGIN.left}, ${MARGIN.top})`);

	$.gTally
		.selectAll('.success')
		.at('x', width - FONT_SIZE)
		.at('y', scale.y(1) + REM * 1.25);
	$.gTally
		.selectAll('.failure')
		.at('x', width - FONT_SIZE)
		.at('y', scale.y(0) - REM * 0.25);
}

function setup(count) {
	$.gTally.at('transform', `translate(${MARGIN.left}, ${MARGIN.top})`);
	const $axis = $.svgTally.select('g.g-axis');
	const $x = $axis.append('g.axis--x');
	const $y = $axis.append('g.axis--y');

	$x
		.append('text.label')
		.text('Number of trials')
		.at('text-anchor', 'middle')
		.at('y', MARGIN.bottom - REM);
	$y
		.append('text.label')
		.text('Success rate')
		.at('text-anchor', 'middle')
		.at('y', -MARGIN.left + FONT_SIZE);

	$.gTally.append('g.g-line').append('path');
	$.gTally.append('g.g-dots');
	$.gTally
		.append('text.success.bg')
		.at('text-anchor', 'end')
		.at('alignment-baseline', 'hanging');
	$.gTally
		.append('text.success.fg')
		.at('text-anchor', 'end')
		.at('alignment-baseline', 'hanging');
	$.gTally
		.append('text.failure.bg')
		.at('text-anchor', 'end')
		.at('alignment-baseline', 'baseline');
	$.gTally
		.append('text.failure.fg')
		.at('text-anchor', 'end')
		.at('alignment-baseline', 'baseline');
	scale.x.domain([0, count]);
}
export default { setup, resize, update, matchFirst };
