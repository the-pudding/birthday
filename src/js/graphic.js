// D3 is included by globally by default
import db from './db';
import flattenMonthData from './flatten-month-data';
import calculateOdds from './calculate-odds';
import render from './render';
import $ from './dom';
import monthData from './month-data';

// import monthData from './month-data';

const BP = 800;
const VERSION = new Date().getTime();
const DATA_URL = `https://pudding.cool/2018/04/birthday-data/data.json?version=${VERSION}`;
const REM = 16;
const DPR = Math.min(window.devicePixelRatio, 2);
// const HEADER_HEIGHT = REM * 4;

const dayData = flattenMonthData();
let rawData = null;
let width = 0;
let height = 0;
let mobile = false;

const currentStep = 'birthday';

const steps = {
	intro: () => {},
	birthday: () => {},
	guess: () => {},
	guessAbove: () => {},
	guessBelow: () => {},
	guessExact: () => {},
	paradox: () => {},
	believe: () => {},
	believeYes: () => {},
	believeNo: () => {},
	run: () => {}
};

function updateStep() {
	const $s = $.step.filter(
		(d, i, n) => d3.select(n[i]).at('data-id') === currentStep
	);
	$.step.classed('is-visible', false);
	$s.classed('is-visible', true);
	const id = $s.at('data-id');
	steps[id]();
}

function updateDimensions() {
	width = $.content.node().offsetWidth;
	height = window.innerHeight;
	mobile = width < BP;
	$.content.st('height', height);
}

function setCanvasDimensions() {
	const cw = $.chartCanvas.node().offsetWidth;
	const ch = $.chartCanvas.node().offsetHeight;

	$.chartCanvas.at({
		width: DPR * cw,
		height: DPR * ch
	});
	$.chartCanvas
		.node()
		.getContext('2d')
		.scale(DPR, DPR);
}

function setupDropdown() {
	const months = monthData.map(d => d.name);
	months.splice(0, 0, 'Month');

	$.dropdown
		.select('.month')
		.selectAll('option')
		.data(months)
		.enter()
		.append('option')
		.text(d => d)
		.at('value', (d, i) => i);

	const days = d3.range(31).map(d => d + 1);
	days.splice(0, 0, 'Day');

	$.dropdown
		.select('.day')
		.selectAll('option')
		.data(days)
		.enter()
		.append('option')
		.text(d => d)
		.at('value', d => d);
}

function resize() {
	updateDimensions();
	setCanvasDimensions();
}

function init() {
	updateDimensions();

	setupDropdown();
	updateStep();

	d3.loadData(DATA_URL, (err, resp) => {
		rawData = resp[0];
		// db.setup();
		resize();
		render.setup();
	});
}

export default { init, resize };
