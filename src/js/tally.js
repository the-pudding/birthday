import $ from './dom';

const RADIUS = 3;
const SECOND = 1000;
const REM = 16;
const FONT_SIZE = 12;
const EASE = d3.easeCubicInOut;
const MARGIN = { top: REM, bottom: REM * 3, left: REM * 3.25, right: REM };
const height = 10 * REM - MARGIN.top - MARGIN.bottom;
let width = 0;
let rawData = [];
let rawData2 = [];
let playerW = 32;
let playerH = 80;
let numTrials = 0;

const scale = { x: d3.scaleLinear(), y: d3.scaleLinear() };
const line = d3
	.line()
	.x((d, i) => scale.x(i + 1))
	.y(d => scale.y(d));

const line2 = d3
	.line()
	.x((d, i) => scale.x(i + 20))
	.y(d => scale.y(d));

function formatInt(num) {
	return d3.format(',d')(num);
}

function isComplete() {
	return rawData2.length;
}

function updateChart(duration = 0) {
	// update success vals
	let total = 0;

	const data = rawData.map((d, i) => {
		total += d ? 1 : 0;
		return total / (i + 1);
	});

	$.gTally
		.select('.g-line path')
		.datum(data)
		.transition()
		.duration(duration)
		.ease(EASE)
		.at('d', line);

	let total2 = 0;
	const preTotal = total - (rawData[rawData.length - 1] ? 1 : 0);
	const preLen = data.length;
	const data2 = rawData2.map((d, i) => {
		total2 += d ? 1 : 0;
		const num = total2 + preTotal;
		const den = i + preLen;
		return num / den;
	});

	// const totalCount = total + total2;

	const $path2 = $.gTally
		.select('.g-line2 path')
		.datum(data2)
		.at('d', line2);

	const totalLength = $path2.node().getTotalLength();

	$path2
		.at('stroke-dasharray', `${totalLength} ${totalLength}`)
		.at('stroke-dashoffset', totalLength * 1)
		.transition()
		.duration(SECOND * 5)
		.ease(d3.easeLinear)
		.at('stroke-dashoffset', 0);

	const circleData = numTrials > 20 ? [] : data;

	const $circle = $.gTally
		.select('.g-dots')
		.selectAll('circle')
		.data(circleData);

	$circle
		.enter()
		.append('circle')
		.at('r', 1)
		.merge($circle)
		.at('cx', (d, i) => scale.x(i + 1))
		.at('cy', d => scale.y(d))
		.transition()
		.duration(SECOND * 0.5)
		.ease(EASE)
		.at('r', RADIUS);

	$circle.exit().remove();

	const successCount =
		rawData.filter(d => d).length + rawData2.filter(d => d).length;
	const failureCount = rawData.length + rawData2.length - successCount;
	const successSuffix = successCount === 1 ? '' : 'es';
	const failureSuffix = failureCount === 1 ? '' : 's';

	const countDuration = rawData2.length ? SECOND * 5 : 0;

	const $success = $.gTally.selectAll('.success');

	$success.select('.word').text(`success${successSuffix}`);
	$success
		.select('.count')
		.transition()
		.duration(countDuration)
		.tween('text', (d, i, n) => {
			const $v = d3.select(n[i]);
			const terp = d3.interpolateNumber($v.text(), successCount);
			return t => $v.text(formatInt(terp(t)));
		});

	const $failure = $.gTally.selectAll('.failure');

	$failure.select('.word').text(`failure${failureSuffix}`);
	$failure
		.select('.count')
		.transition()
		.duration(countDuration)
		.tween('text', (d, i, n) => {
			const $v = d3.select(n[i]);
			const terp = d3.interpolateNumber($v.text(), failureCount);
			return t => $v.text(formatInt(terp(t)));
		});
}

function update(match) {
	rawData.push(match);
	rawData2 = [];
	updateChart();
}

function updateBatch(matches) {
	rawData2 = [rawData[rawData.length - 1]].concat(matches);
	updateChart();
}

function clear(start) {
	rawData = rawData.slice(0, start);
	rawData2 = [];
	updateChart();
}

function matchFirst() {
	return rawData[0];
}

function updateAxis() {
	const $x = $.svgTally.select('.axis--x');
	$x.select('.label').at('transform', `translate(${width / 2}, 0)`);

	const axisX = d3
		.axisBottom()
		.scale(scale.x)
		.ticks(4);

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
		.at('x', width - FONT_SIZE * 0.5)
		.at('y', scale.y(1) + REM);
	$.gTally
		.selectAll('.failure')
		.at('x', width - FONT_SIZE * 0.5)
		.at('y', scale.y(0) - REM * 0.25);
}
function resize(p) {
	playerW = p.playerW;
	playerH = p.playerH;
	const w = $.graphicUi.node().offsetWidth;
	width = w - MARGIN.left - MARGIN.right;

	scale.x.range([0, width]);
	scale.y.range([height, 0]);

	updateAxis();
}

function setTrials(count = 20) {
	numTrials = count;
	scale.x.domain([1, count]);
	updateAxis();
	if (rawData.length) updateChart(rawData.length > 1 ? SECOND : 0);
}

function createText(className) {
	const align = className === 'success' ? 'hanging' : 'baseline';

	const bg = $.gTally
		.append(`text.${className}.bg`)
		.at('text-anchor', 'end')
		.at('alignment-baseline', align);

	const fg = $.gTally
		.append(`text.${className}.fg`)
		.at('text-anchor', 'end')
		.at('alignment-baseline', align);

	bg.append('tspan.count');
	bg.append('tspan.word').at('dx', FONT_SIZE * 0.25);
	fg.append('tspan.count');
	fg.append('tspan.word').at('dx', FONT_SIZE * 0.25);
}
function setup() {
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
	$.gTally.append('g.g-line2').append('path');

	$.gTally.append('g.g-dots');

	createText('success');
	createText('failure');

	setTrials();
}
export default {
	setup,
	resize,
	update,
	matchFirst,
	clear,
	isComplete,
	setTrials,
	updateBatch
};
