// D3 is included by globally by default
import * as noUiSlider from 'nouislider';
import db from './db';
import tally from './tally';
import math from './math';
import render from './render';
import $ from './dom';
import flattenMonthData from './flatten-month-data';
import calculateOdds from './calculate-odds';
import monthData from './month-data';

const BP = 800;
const VERSION = new Date().getTime();
const DATA_URL = `https://pudding.cool/2018/04/birthday-data/data.json?version=${VERSION}`;
const DPR = Math.min(window.devicePixelRatio, 2);
const RUSSELL_INDEX = 319;
const SECOND = 1000;
const REM = 16;
const MARGIN = REM * 2;
const JORDAN = 23;

const storedSteps = [];
const dayData = flattenMonthData();
let rawData = null;
let width = 0;
let height = 0;
let userMonth = -1;
let userDay = -1;
let userIndex = -1;
let userGuess = -1;
let currentStep = 'intro';

const steps = {
	intro: () => {
		rainBalloons();
	},
	birthday: () => {},
	guess: () => {
		render.showBirthday('Russell');
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
		const oddsFormatted = d3.format('.1%')(odds);
		const oddsDisplay = oddsFormatted === '100.0%' ? '> 99.9%' : oddsFormatted;
		$s.select('.percent').text(oddsDisplay);
		delayedButton();
		db.closeConnection();
	},
	guessBelow: () => {
		const $s = getStepTextEl();
		const odds = calculateOdds(userGuess);
		$s.select('.people').text(userGuess);
		const oddsFormatted = d3.format('.1%')(odds);
		const oddsDisplay = oddsFormatted === '100.0%' ? '> 99.9%' : oddsFormatted;
		$s.select('.percent').text(oddsDisplay);
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
		const dict = [];
		dict[RUSSELL_INDEX] = true;
		dict[userIndex] = true;
		let matched = false;

		const recentData = rawData.recent.map(d => ({ ago: d.ago, day: d.day }));
		const release = () => {
			const player = recentData.pop();
			let balloon = false;
			if (dict[player.day]) {
				matched = true;
				balloon = true;
			} else dict[player.day] = true;

			// last one has been placed
			const next = d => {
				tally.update(matched);
				currentStep = 'result';
				updateStep();
			};

			const cb = i === 20 ? next : null;

			render.addRecentPlayer({ player, speed, balloon }, cb);

			i += 1;
			if (i < 21) d3.timeout(release, SECOND / speed);
		};
		d3.timeout(release, SECOND * 5);
	},
	result: () => {
		const $text = getStepTextEl();
		$text.select('.result--no').classed('is-visible', !tally.matchFirst());
		$text.select('.result--yes').classed('is-visible', tally.matchFirst());
		delayedButton();
	},
	more: () => {
		$.svgTally.classed('is-visible', true);
		const $btn = getStepButtonEl();
		$btn.classed('is-hidden', true);

		const $text = getStepTextEl();

		let group = 0;
		const times = 19;
		let i = 0;
		let speed = 2;
		let dict = [];
		let matched = false;
		const recentData = rawData.recent
			.slice(21)
			.map(d => ({ ago: d.ago, day: d.day }));

		const release = () => {
			const player = recentData.pop();
			let balloon = false;

			if (dict[player.day]) {
				matched = true;
				balloon = true;
			} else dict[player.day] = true;

			// last one has been placed
			const next = d => {
				currentStep = 'all';
				updateStep();
			};

			const cb = i === 22 && group === times - 1 ? next : null;

			render.addRecentPlayer({ player, speed, balloon, hideLabel: true }, cb);

			i += 1;
			if (i < JORDAN) d3.timeout(release, SECOND / speed);
			else {
				group += 1;
				tally.update(matched);
				if (group < times) {
					dict = [];
					i = 0;
					matched = false;
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
					d3.timeout(() => {
						render.removePlayers();
						release();
					}, SECOND / speed);
				}
			}
		};

		render.removePlayers();
		d3.timeout(release, SECOND * 3);
	},
	all: () => {
		$.svgTally.classed('is-visible', true);
		const $btn = getStepButtonEl();
		$btn.classed('is-hidden', true);

		const speed = 64;
		const total = rawData.tally.length;
		const rate = Math.min(SECOND * 8 / total, 200);
		const tallyData = rawData.tally.map(d => d);

		const release = () => {
			render.removePlayers();
			const matched = tallyData.pop();

			// const cb = i === 20 ? next : null;
			const players = d3
				.range(JORDAN)
				.map(d => ({ ago: d, day: Math.floor(Math.random() * 366) }));
			players.forEach((player, i) => {
				const balloon = i === 0 && matched;
				render.addRecentPlayer({ player, speed, balloon });
			});
			tally.update(matched);
			if (tallyData.length) d3.timeout(release, rate);
			else {
				console.log('delayed button');
				$btn.classed('is-hidden', false);
				delayedButton(0);
			}
		};
		d3.timeout(release, SECOND * 5);
	},
	math: () => {
		render.removePlayers();
		$.chartTimeline.classed('is-dateless', true);
		const speed = 64;
		const balloon = false;
		const count = 2;
		const w = 1 / count * 366;
		const players = d3.range(count).map(d => {
			const day = Math.floor(d * w + w / 2);
			return { ago: 0, day };
		});

		players.forEach(player =>
			render.addRecentPlayer({ player, speed, balloon })
		);
		delayedButton();
	},
	mathRun: () => {
		$.chartTimeline.classed('is-dateless', true);
		$.svgMath.classed('is-visible', true);
		$.mathInfo.classed('is-visible', true);

		let i = 0;
		const data = [2, 5, 10, 23];
		const speed = 64;
		const balloon = false;

		// last one has been done
		const next = () => {
			delayedButton();
		};

		const release = () => {
			render.removePlayers();
			const count = data[i];
			const w = 1 / count * 366;
			const players = d3.range(count).map(d => {
				const day = Math.floor(d * w + w / 2);
				return { ago: 0, day };
			});

			players.forEach(player =>
				render.addRecentPlayer({ player, speed, balloon })
			);

			math.update(players);

			i += 1;
			if (i < data.length) d3.timeout(release, SECOND * 5);
			else next();
		};
		release();
	},
	conclusion: () => {
		delayedButton();
	}
};

function rainBalloons() {
	render.createBalloon({ destDay: Math.floor(Math.random() * 366) });
	if (currentStep === 'intro') d3.timeout(rainBalloons, 200);
}
function delayedButton(delay = SECOND * 2) {
	const $btn = getStepButtonEl();
	d3.timeout(() => {
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
	storedSteps.push(currentStep);
	const $s = getStepEl();
	const id = $s.at('data-id');
	$.graphicChart.classed('is-visible', id !== 'intro');
	$.svgTally.classed('is-visible', false);
	$.svgMath.classed('is-visible', false);
	$.mathInfo.classed('is-visible', false);
	$.chartTimeline.classed('is-dateless', false);
	steps[id]();
	$.step.classed('is-visible', false);
	$s.classed('is-visible', true);
}

function updateDimensions() {
	width = $.content.node().offsetWidth;
	height = window.innerHeight;
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
	tally.resize();
	math.resize();
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
			$.graphicUi.classed('is-short', true);
			if (userGuess === JORDAN) currentStep = 'guessExact';
			else if (Math.abs(JORDAN - userGuess) < 3) currentStep = 'guessClose';
			else if (userGuess > JORDAN) currentStep = 'guessAbove';
			else currentStep = 'guessBelow';
			break;

		case 'guessAbove':
			currentStep = 'paradox';
			break;
		case 'guessBelow':
			currentStep = 'paradox';
			break;
		case 'guessClose':
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
		case 'all':
			currentStep = 'math';
			break;
		case 'math':
			currentStep = 'mathRun';
			break;
		case 'mathRun':
			currentStep = 'conclusion';
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
		userIndex = index;
		userMonth = m;
		userDay = day;
		$.dropdown
			.selectAll('.month option')
			.prop('selected', (d, i) => i === userMonth);
		$.dropdown
			.selectAll('.day option')
			.prop('selected', (d, i) => i === userDay);
		$.dropdown.select('.day').prop('disabled', false);
		render.updateUser(userIndex);
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

function begin() {
	const $btn = getStepButtonEl();
	$btn.text('Begin');
	delayedButton(500);
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
		render.setup(begin);
		setupUser();
		const trials = Math.floor((rawData.count + 2) / JORDAN);
		tally.setup(trials);
		math.setup();
		resize();
	});
}

export default { init, resize };
