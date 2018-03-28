// D3 is included by globally by default
import * as noUiSlider from 'nouislider';
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
const DPR = Math.min(window.devicePixelRatio, 2);
const RUSSELL_INDEX = 319;
const SECOND = 1000;

const dayData = flattenMonthData();
let rawData = null;
let width = 0;
let height = 0;
let mobile = false;
let userMonth = -1;
let userDay = -1;
let userIndex = -1;
let userGuess = -1;
let userMatch = null;
const userTally = [];
// let ready = false;

let currentStep = 'intro';

const steps = {
	intro: () => {
		delayedButton(1000);
	},
	birthday: () => {},
	guess: () => {
		const $s = getStepTextEl();
		$s
			.selectAll('.guess--no')
			.classed('is-visible', userIndex !== RUSSELL_INDEX);
		$s
			.selectAll('.guess--yes')
			.classed('is-visible', userIndex === RUSSELL_INDEX);
	},
	guessAbove: () => {
		const $s = getStepTextEl();
		const odds = calculateOdds(userGuess);
		$s.select('.people').text(userGuess);
		$s.select('.percent').text(d3.format('.1%')(odds));
		delayedButton();
		db.closeConnection();
	},
	guessBelow: () => {
		const $s = getStepTextEl();
		const odds = calculateOdds(userGuess);
		$s.select('.people').text(userGuess);
		$s.select('.percent').text(d3.format('.1%')(odds));
		delayedButton();
		db.closeConnection();
	},
	guessExact: () => {
		delayedButton();
		db.closeConnection();
	},
	paradox: () => {
		delayedButton();
	},
	believe: () => {
		// release 1 every X seconds
		const $btn = getStepButtonEl();
		$btn.classed('is-hidden', true);
		render.hideSpecialLabels();
		let i = 0;
		const speed = 2;
		const release = () => {
			const dict = [];
			const r = rawData.recent.pop();

			dict[RUSSELL_INDEX] = true;
			dict[userDay] = true;

			if (dict[r.day]) userMatch = r.day;
			else dict[r.day] = true;

			render.addRecentPlayer({ player: r, speed });
			i += 1;
			if (i < 21) setTimeout(release, SECOND / speed);
			else {
				currentStep = 'result';
				setTimeout(updateStep, SECOND);
			}
		};
		setTimeout(release, SECOND * 3);
	},
	result: () => {
		const $text = getStepTextEl();
		$text.select('.result--no').classed('is-visible', !userMatch);
		$text.select('.result--yes').classed('is-visible', userMatch);
		delayedButton();
	},
	more: () => {
		const $btn = getStepButtonEl();
		$btn.classed('is-hidden', true);

		const $text = getStepTextEl();

		let group = 0;
		const times = 19;
		let i = 0;
		let speed = 2;
		let dict = [];

		const release = () => {
			const player = rawData.recent.pop();
			if (dict[player.day]) userTally[group] = player.day;
			else dict[player.day] = true;

			render.addRecentPlayer({ player, speed });

			i += 1;
			if (i < 23) setTimeout(release, SECOND / speed);
			else {
				group += 1;
				if (group < times) {
					dict = [];
					i = 0;
					userTally[group] = null;
					if (group === 1) {
						speed = 4;
						$text.select('.speed--1').classed('is-visible', true);
					} else if (group === 2) {
						speed = 8;
						$text.select('.speed--2').classed('is-visible', true);
					} else if (group === 3) speed = 16;
					else if (group === 4) {
						speed = 32;
						$text.select('.speed--3').classed('is-visible', true);
					}
					setTimeout(() => {
						render.removePlayers();
						release();
					}, SECOND / speed);
				} else {
					console.log(userTally);
					// TODO currentStep update here
				}
			}
		};

		render.removePlayers();
		userTally[0] = null;
		setTimeout(release, SECOND * 3);
	}
};

function delayedButton(delay = SECOND * 2) {
	const $btn = getStepButtonEl();
	setTimeout(() => {
		$btn.prop('disabled', false);
	}, delay);
}

function getStepEl() {
	return $.step.filter(
		(d, i, n) => d3.select(n[i]).at('data-id') === currentStep
	);
}

function getStepTextEl() {
	return $.step.filter((d, i, n) => {
		const el = d3.select(n[i]);
		const cur = el.at('data-id') === currentStep;
		const text = el.classed('text__step');
		return cur && text;
	});
}

function getStepButtonEl() {
	const $s = $.step.filter((d, i, n) => {
		const el = d3.select(n[i]);
		const cur = el.at('data-id') === currentStep;
		const ui = el.classed('ui__step');
		return cur && ui;
	});
	return $s.select('button');
}

function updateStep() {
	const $s = getStepEl();
	const id = $s.at('data-id');
	steps[id]();
	$.step.classed('is-visible', false);
	$s.classed('is-visible', true);
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
	$btn.prop('disabled', text === '...');
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

	$day.selectAll('option').prop('disabled', (d, i) => i > days);

	// edge case
	if (userDay > days) {
		userDay = days;
		$day
			.selectAll('option')
			.filter((d, i) => i === days)
			.prop('selected', true);
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

function handleSlide(a) {
	const [val] = a;
	userGuess = val;
	const $btn = getStepButtonEl();
	$btn.select('.people').text(`${val} people`);
	$btn.prop('disabled', false);
}

function handleButtonClick() {
	const $btn = d3.select(this);
	if (!$btn.prop('disabled')) {
		switch (currentStep) {
		case 'intro':
			currentStep = 'birthday';
			break;
		case 'birthday':
			db.update({ key: 'day', value: userIndex });
			currentStep = 'guess';
			break;

		case 'guess':
			db.update({ key: 'guess', value: userGuess });
			currentStep = 'guess';
			currentStep =
					userGuess === 23
						? 'guessExact'
						: userGuess < 23 ? 'guessBelow' : 'guessAbove';
			break;

		case 'guessAbove':
			currentStep = 'paradox';
			break;
		case 'guessBelow':
			currentStep = 'paradox';
			break;
		case 'guessExact':
			currentStep = 'paradox';
			break;
		case 'paradox':
			currentStep = 'believe';
			break;
		case 'result':
			currentStep = 'more';
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

function setupSlider() {
	const min = 2;
	const max = 365;
	const start = 2 + Math.floor(Math.random() * (max - 2));
	const el = d3.select('.slider').node();

	noUiSlider
		.create(el, {
			start,
			step: 1,
			tooltips: true,
			format: {
				to: value => Math.round(value),
				from: value => Math.round(value)
			},
			range: { min, max }
		})
		.on('slide', handleSlide);
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
			.prop('selected', (d, i) => i === userMonth);
		$.dropdown
			.selectAll('.day option')
			.prop('selected', (d, i) => i === userDay);
		$.dropdown.select('.day').prop('disabled', false);
		render.updateUser(index);
		userGuess = db.getGuess();
		if (userGuess) {
			d3
				.select('.slider')
				.node()
				.noUiSlider.set(userGuess);
			const $btn = $.graphicUi.select('.ui__step--guess button');
			$btn.select('.people').text(userGuess);
			$btn.prop('disabled', false);
		}

		changeUserInfo();
	}
}

function init() {
	updateDimensions();

	setupDropdown();
	setupButton();
	setupSlider();
	updateStep();

	d3.loadData(DATA_URL, (err, resp) => {
		rawData = resp[0];
		db.setup();
		render.setup(rawData);
		resize();
		setupUser();
		// ready = true;
		steps.intro();
	});
}

export default { init, resize };
