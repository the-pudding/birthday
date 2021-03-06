import $ from './dom';
import monthData from './month-data';
import flattenMonthData from './flatten-month-data';
import calculateOdds from './calculate-odds';

const REM = 16;
const RADIUS = 5;
const MARGIN = REM;
const GUESS_HEIGHT = 64;
const DISTRIBUTION_HEIGHT = 96;
const PROBABILITY_HEIGHT = 96;
const FONT_SIZE = 12;
let width = 0;
let userGuess = 0;
let evenDist = 0;
let dayData = null;

const mobile = d3.select('body').classed('is-mobile');

const scale = {
	guess: {
		x: d3.scaleLinear(),
		opacity: d3.scaleLinear()
	},
	distribution: {
		x: d3.scaleBand(),
		y: d3.scaleLinear(),
		month: d3.scaleBand()
	},
	probability: {
		x: d3.scaleLinear(),
		y: d3.scaleLinear()
	}
};

function resizeGuess() {
	const w = width - MARGIN * 4;
	scale.guess.x.range([0, w]);
	const $svg = $.appendixGuess.select('svg');
	$svg.at({ width: w + MARGIN * 4, height: GUESS_HEIGHT });
	$svg
		.selectAll('.guess')
		.at(
			'transform',
			d => `translate(${scale.guess.x(d.key)}, ${GUESS_HEIGHT / 2})`
		);

	const $axis = $svg.select('.axis');
	$axis.at('transform', `translate(0, ${GUESS_HEIGHT / 2})`);
	$axis.select('line').at('x2', w);
	$axis.select('.start').at('x', 0);
	$axis.select('.end').at('x', w);
}

function resizeDistribution() {
	const w = width - MARGIN * 3;
	const h = DISTRIBUTION_HEIGHT - MARGIN * 1.25;
	scale.distribution.x.range([0, w]).padding(0);
	scale.distribution.y.range([h, 0]);
	scale.distribution.month.range([0, w]);

	const rectW = scale.distribution.x.bandwidth();
	const monthW = scale.distribution.month.bandwidth();

	const $svg = $.appendixDistribution.select('svg');

	$svg.at({ width: w + MARGIN * 3, height: DISTRIBUTION_HEIGHT });
	$svg
		.selectAll('.day')
		.at('transform', d => {
			const x = scale.distribution.x(d.key);
			const y = scale.distribution.y(d.value);
			return `translate(${x}, ${y})`;
		})
		.select('rect')
		.at('height', d => h - scale.distribution.y(d.value))
		.at('width', rectW);

	const axisY = d3
		.axisLeft()
		.scale(scale.distribution.y)
		.tickSize(-w)
		.tickPadding(FONT_SIZE / 2)
		.ticks(4);

	const $y = $svg.select('.axis--y');

	$y.call(axisY).at('transform', `translate(${MARGIN * 2}, ${MARGIN * 0.25})`);

	const $x = $svg.select('.axis--x');
	$x.at('transform', `translate(${MARGIN * 2}, ${h + MARGIN * 1.25})`);
	$x.selectAll('.month').at('transform', (d, i) => {
		const x = scale.distribution.month(i) + monthW / 2;
		return `translate(${x}, 0)`;
	});

	const y = scale.distribution.y(evenDist);
	const $even = $svg.select('.g-even');
	$even.at('transform', `translate(0,${y})`);
	$even.selectAll('text').at('x', w - FONT_SIZE * 0.25);
	$even.select('line').at('x2', w);

	$svg.select('.interaction').at({ width: w, height: h });
}

function resizeProbability() {
	const w = width - MARGIN * 2.5;
	const h = PROBABILITY_HEIGHT - MARGIN * 2.75;
	scale.probability.x.range([0, w]);
	scale.probability.y.range([h, 0]);

	scale.probability.x.range([0, w]);
	scale.probability.y.range([h, 0]);

	const $svg = $.appendixProbability.select('svg');

	$svg.at({ width: w + MARGIN * 2.5, height: PROBABILITY_HEIGHT });

	const $x = $svg.select('.axis--x');
	$x.select('.label').at('transform', `translate(${w / 2}, 0)`);

	const axisX = d3.axisBottom().scale(scale.probability.x);

	$x
		.call(axisX)
		.at('transform', `translate(${MARGIN * 1.5},${h + MARGIN * 0.25})`);

	const $y = $svg.select('.axis--y');

	const axisY = d3
		.axisLeft()
		.scale(scale.probability.y)
		.tickSize(-w)
		.tickPadding(FONT_SIZE / 2)
		.tickValues([0, 0.25, 0.5, 0.75, 1]);
	// .tickFormat(d3.format('.0%'));

	$y
		.call(axisY)
		.at('transform', `translate(${MARGIN * 1.5}, ${MARGIN * 0.25})`);

	const data = d3.range(101).map(calculateOdds);

	const line = d3
		.line()
		.x((d, i) => scale.probability.x(i))
		.y(d => scale.probability.y(d))
		.curve(d3.curveStepAfter);

	$svg
		.select('.g-line path')
		.datum(data)
		.at('d', line);

	$svg.select('.interaction').at({ width: w, height: h });

	const offX = scale.probability.x(23);
	const $jordan = $svg.select('.g-jordan');
	$jordan.at('transform', `translate(${offX}, 0)`);
	$jordan.selectAll('text').text('23 people = 50.7%');

	$jordan
		.selectAll('text')
		.at('y', h / 2 + FONT_SIZE / 3)
		.at('x', FONT_SIZE / 2);
	$jordan.select('line').at({
		y1: 0,
		y2: h
	});
}

function handleProbabilityMousemove() {
	const $svg = $.appendixProbability.select('svg');

	const [x] = d3.mouse(this);

	const posX = x;
	const index = Math.floor(scale.probability.x.invert(x));
	let p = d3.format('.1%')(calculateOdds(index));
	p = p.includes('100') ? '> 99.9%' : p;

	const text = `${index} people = ${p}`;

	const align = index < 50 ? 'start' : 'end';
	const dx = index < 50 ? 1 : -1;
	const offX = scale.probability.x(index);
	const $jordan = $svg.select('.g-jordan');
	$jordan.at('transform', `translate(${offX}, 0)`);
	$jordan
		.selectAll('text')
		.at('text-anchor', align)
		.at('x', FONT_SIZE * 0.5 * dx)
		.text(text);
}

function handleDistributionMousemove() {
	const $svg = $.appendixDistribution.select('svg');

	const [x] = d3.mouse(this);
	const posX = x;
	const posY = 0;

	const w = scale.distribution.x.bandwidth();
	const index = Math.max(0, Math.floor(x / w));
	const { value } = $svg
		.selectAll('.day')
		.filter((d, i) => i === index)
		.datum();

	const { month, day } = dayData[index];
	const text = `${month.substring(0, 3)} ${day}: `;

	const $tip = $svg.select('.g-tooltip');
	let align = 'middle';
	if (posX < 150) align = 'start';
	else if (width - posX < 150) align = 'end';
	$tip.selectAll('text').at('text-anchor', align);
	$tip.selectAll('.month').text(text);
	$tip.selectAll('.count').text(`${value} people`);
	$tip.classed('is-visible', true);
	$tip.at('transform', `translate(${posX}, ${posY})`);
}

function handleDistributionMouseout() {
	$.appendixDistribution.select('.g-tooltip').classed('is-visible', false);
}

function resize() {
	width = $.appendix.node().offsetWidth;
	resizeGuess();
	resizeDistribution();
	resizeProbability();
}

function updateGuess(g) {
	userGuess = g;
	const userText = `You: ${userGuess}`;
	const $guess = $.appendixGuess
		.selectAll('.guess')
		.filter(d => d.id === 'you');

	const d = $guess.datum();
	d.key = g;
	$guess.datum(d);

	$guess.at(
		'transform',
		d => `translate(${scale.guess.x(d.key)}, ${GUESS_HEIGHT / 2})`
	);

	$guess.select('text').text(userText);
}

function getAverageGuess(data) {
	// const sum = d3.sum(clean, d => d.key * d.value);
	// const avg = Math.round(sum / count);
	// const all = [];
	// data.forEach(d => {
	// 	d3.range(d.value).forEach(() => all.push(d.key));
	// });
	const count = d3.sum(data, d => d.value);
	const target = Math.floor(count / 2);
	let i = 0;
	let inc = 0;
	let found = false;
	while (!found) {
		const cur = data[i];
		inc += cur.value;
		i += 1;
		if (inc > target) {
			found = true;
			return cur.key;
		}
	}
	return 180;
}

function setupGuess(data) {
	const clean = data
		.map(d => ({ ...d, key: +d.key }))
		.sort((a, b) => d3.ascending(a.key, b.key));
	const avg = getAverageGuess(clean);
	const maxGuessCount = d3.max(clean, d => d.value);

	const avgText = `Avg: ${avg}`;
	const userText = `You: ${userGuess}`;

	clean.push({ key: avg, value: 0, special: avgText });
	clean.push({ key: userGuess, value: 0, special: userText, id: 'you' });

	const $svg = $.appendixGuess.append('svg');
	const $g = $svg.append('g');

	$g.at('transform', `translate(${MARGIN * 2}, 0)`);

	const min = 2;
	const max = 365;
	scale.guess.x.domain([min, max]);
	scale.guess.opacity.domain([0, maxGuessCount]);
	const $axis = $g.append('g.axis');
	$axis.append('line').at({ x1: 0, y1: 0, x2: 0, y2: 0 });
	$axis
		.append('text.start')
		.at({ x: 0, y: FONT_SIZE * 1.75 })
		.text(min)
		.at('text-anchor', 'start');
	$axis
		.append('text.end')
		.at({ x: 0, y: FONT_SIZE * 1.75 })
		.text(max)
		.at('text-anchor', 'end');
	const $enter = $g
		.selectAll('.guess')
		.data(clean)
		.enter()
		.append('g.guess');
	$enter
		.append('circle')
		.at({
			cx: 0,
			cy: 0
		})
		.at('r', d => (d.special ? RADIUS * 1.5 : RADIUS))
		.st('opacity', d => (d.special ? 1 : scale.guess.opacity(d.value)))
		.classed('you', d => d.special && d.special.includes('You'))
		.classed('avg', d => d.special && d.special.includes('Avg'));

	$enter.each((d, i, n) => {
		if (d.special) {
			const $text = d3.select(n[i]).append('text');
			const off = d.special.includes('You') ? -1.25 : 2;
			$text.at('text-anchor', 'middle').at('y', FONT_SIZE * off);
			$text.text(d.special);
		}
	});
}

function setupDistribution(data) {
	const clean = data.map(d => ({ ...d, key: +d.key }));
	clean.sort((a, b) => d3.ascending(a.key, b.key));
	const maxDistCount = d3.max(clean, d => d.value);
	const max = 366;

	const $svg = $.appendixDistribution.append('svg');
	const $axis = $svg.append('g.g-axis');
	const $g = $svg.append('g');

	$g.at('transform', `translate(${MARGIN * 2}, ${MARGIN * 0.25})`);

	scale.distribution.x.domain(d3.range(max));
	scale.distribution.y.domain([0, maxDistCount]);
	scale.distribution.month.domain(d3.range(monthData.length));

	const $x = $axis.append('g.axis--x');
	const $y = $axis.append('g.axis--y');

	$x
		.selectAll('.month')
		.data(monthData)
		.enter()
		.append('text.month')
		.at('text-anchor', 'middle')
		.text(d => d.name.substring(0, 3));

	const $enter = $g
		.selectAll('.day')
		.data(clean)
		.enter()
		.append('g.day');
	$enter.append('rect').at({
		x: 0,
		y: 0
	});

	const $even = $g.append('g.g-even');

	$even
		.append('text.bg')
		.text('Expected')
		.at('y', FONT_SIZE * 1.25)
		.at('text-anchor', 'end');
	$even
		.append('text.fg')
		.text('Expected')
		.at('y', FONT_SIZE * 1.25)
		.at('text-anchor', 'end');

	$even.append('line').at({
		x1: 0,
		x2: 0,
		y1: 0,
		y2: 0
	});

	if (!mobile) {
		$g
			.append('rect.interaction')
			.at({ x: 0, y: 0 })
			.on('mousemove', handleDistributionMousemove)
			.on('mouseout', handleDistributionMouseout);

		const $tip = $g.append('g.g-tooltip');
		const $bg = $tip.append('text.bg').at('y', FONT_SIZE * 0.5);
		$bg.append('tspan.month');
		$bg.append('tspan.count');
		const $fg = $tip.append('text.fg').at('y', FONT_SIZE * 0.5);
		$fg.append('tspan.month');
		$fg.append('tspan.count');
	}
}

function setupProbability() {
	const $svg = $.appendixProbability.append('svg');

	const $axis = $svg.append('g.g-axis');
	const $x = $axis.append('g.axis--x');
	const $y = $axis.append('g.axis--y');
	const $g = $svg.append('g');
	$g.at('transform', `translate(${MARGIN * 1.5}, ${MARGIN * 0.25})`);

	$x
		.append('text.label')
		.text('Number of people')
		.at('text-anchor', 'middle')
		.at('y', MARGIN * 2.25);

	$g.append('g.g-line').append('path');

	scale.probability.x.domain([0, 100]);

	const $jordan = $g.append('g.g-jordan');
	$jordan.append('text.bg');
	$jordan.append('text.fg');
	$jordan.append('line').at({
		x1: 0,
		y1: 0,
		x2: 0,
		y2: 0
	});

	if (!mobile) {
		$g
			.append('rect.interaction')
			.at({ x: 0, y: 0 })
			.on('mousemove', handleProbabilityMousemove);
	}
}

function setup(rawData) {
	dayData = flattenMonthData();
	evenDist = rawData.count / 366;
	$.appendix.select('.count').text(d3.format(',')(rawData.count));
	setupGuess(rawData.binnedGuess);
	setupDistribution(rawData.binnedDay);
	setupProbability();
}

export default { resize, setup, updateGuess };
