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
let userMonth = -1;
let userDay = -1;
let userIndex = -1;

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
	render.resize(cw);

	$.chartCanvas.at({
		width: DPR * cw,
		height: DPR * ch
	});
	$.chartCanvas
		.node()
		.getContext('2d')
		.scale(DPR, DPR);
}

function resize() {
	updateDimensions();
	setCanvasDimensions();
}

function changeUserInfo() {
	let text = null;
	if (userMonth > -1 && userDay > -1) {
		const m = monthData[userMonth - 1].name;
		text = `${m} ${userDay}`;
		userIndex = dayData.findIndex(d => d.month === m && d.day === userDay);
		render.updateUser(userIndex);
	} else text = '...';

	const $btn = $.graphicUi.select('.ui__step--birthday button');
	$btn.select('.date').text(text);
	$btn.property('disabled', text === '...');
}

// EVENTS
function handleMonthChange() {
	const v = this.value;
	const $day = $.dropdown.select('.day');
	if (v === '0') {
		userMonth = -1;
		$day.node().disabled = true;
	} else {
		userMonth = +v;
		$day.node().disabled = false;
	}
	const days = userMonth === -1 ? 0 : monthData[userMonth - 1].days;

	$day.selectAll('option').property('disabled', (d, i) => i > days);

	// edge case
	if (userDay > days) {
		userDay = days;
		$day
			.selectAll('option')
			.filter((d, i) => i === days)
			.property('selected', true);
	}
	changeUserInfo();
}

function handleDayChange() {
	const v = this.value;
	if (v === 'Day') {
		userDay = -1;
	} else {
		userDay = +v;
	}
	changeUserInfo();
}

function handleButtonClick() {
	const $btn = d3.select(this);
	if (!$btn.property('disabled')) {
		switch (currentStep) {
		case 'birthday':
			db.update({ key: 'day', value: userIndex });
			break;

		default:
			break;
		}

		updateStep();
	}
}

// SETUP
function setupDropdown() {
	const months = monthData.map(d => d.name);
	months.splice(0, 0, 'Month');

	const $month = $.dropdown.select('.month');

	$month
		.selectAll('option')
		.data(months)
		.enter()
		.append('option')
		.text(d => d)
		.at('value', (d, i) => i);

	$month.on('input', handleMonthChange);

	const days = d3.range(31).map(d => d + 1);
	days.splice(0, 0, 'Day');

	const $day = $.dropdown.select('.day');

	$day
		.selectAll('option')
		.data(days)
		.enter()
		.append('option')
		.text(d => d)
		.at('value', d => d);

	$day.on('input', handleDayChange);
}

function setupButton() {
	$.uiButton.on('click', handleButtonClick);
}

function setupUser() {
	const index = db.getDay();
	if (typeof index === 'number') {
		const { month, day } = dayData[index];
		const m = monthData.findIndex(d => d.name === month) + 1;
		userMonth = m;
		userDay = day;
		$.dropdown
			.selectAll('.month option')
			.property('selected', (d, i) => i === userMonth);
		$.dropdown
			.selectAll('.day option')
			.property('selected', (d, i) => i === userDay);
		$.dropdown.select('.day').property('disabled', false);
		render.updateUser(index);
		changeUserInfo();
	}
}

function init() {
	updateDimensions();

	setupDropdown();
	setupButton();
	updateStep();

	d3.loadData(DATA_URL, (err, resp) => {
		rawData = resp[0];
		db.setup();
		render.setup();
		resize();
		setupUser();
	});
}

export default { init, resize };
