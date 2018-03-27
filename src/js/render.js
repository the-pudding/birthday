import loadImage from './utils/load-image';
import $ from './dom';
import flattenMonthData from './flatten-month-data';

const dayData = flattenMonthData();

const PLAYER_W = 32;
const PLAYER_H = 64;
const NUM_TICKS_PER_FRAME = 8;
const NUM_FRAMES = 4;
const STEP_PIXELS = 2;
const LABEL_LINE_HEIGHT = 12;
const REM = 16;
const SVG_HEIGHT = REM * 6;
const RUSSELL_INDEX = 319;

const scale = d3.scaleLinear();
const info = {};
const players = [];

let recentData = null;
let tallyData = null;

let width = 0;
const $label = null;

function clearContext() {
	info.context.clearRect(0, 0, info.canvas.width, info.canvas.height);
}

function renderPlayer({ srcX, srcY, posX, posY }) {
	info.context.drawImage(
		info.bufferCanvas,
		srcX * PLAYER_W,
		srcY * PLAYER_H,
		PLAYER_W,
		PLAYER_H,
		Math.floor(posX - PLAYER_W / 2),
		posY,
		PLAYER_W,
		PLAYER_H
	);
}

function checkUpdateFrame(p) {
	const target = Math.abs(Math.floor(NUM_TICKS_PER_FRAME / p.speed));
	// update animation frame
	if (p.ticks % target === target - 1) {
		p.frame += 1;
		if (p.frame >= NUM_FRAMES) p.frame = 0;
		if (p.state === 0) p.frame = 0;
		p.ticks = 0;
	}
}

function updatePlayer(p) {
	if (p.state) {
		// frame animation
		p.ticks += 1;
		checkUpdateFrame(p);

		// move player
		const rate = STEP_PIXELS * p.speed;
		p.x += rate * (p.state === 2 ? 1 : -1);
		// stop moving
		const diff = p.destX - p.x;
		const doneLeft = p.state === 1 && diff > 0;
		const doneRight = p.state === 2 && diff < 0;
		if (doneLeft || doneRight) {
			p.x = p.destX;
			p.state = 0;
			p.frame = 0;
		}
	}

	renderPlayer({
		srcX: p.frame,
		srcY: p.state,
		posX: p.x,
		posY: 0
	});

	p.labelEl.at('transform', `translate(${p.x}, 0)`);
}
function tick() {
	// const timeCurrent = new Date().getTime();
	// const timeElapsed = timeCurrent - timePrevious;
	// if (timeElapsed > framerate) {
	// 	timePrevious = timeCurrent;
	// }
	clearContext();
	players.forEach(updatePlayer);
	window.requestAnimationFrame(tick);
}

function updateUser(d) {
	const p = players.find(player => player.id === 'You');
	p.destDay = d;
	p.destX = scale(d);

	// moving left or right
	p.state = p.destX < p.x ? 1 : 2;
}

function createLabel({ id, showLabel, day }) {
	const match = dayData[day];
	const date = `${match.month.slice(0, 3)} ${match.day}`;
	const el = $.gLabel.append('g.label');
	el.classed('is-visible', showLabel);

	el
		.append('text.id')
		.text(id)
		.at('text-anchor', 'middle')
		.at('y', -REM * 1.33);

	el
		.append('text.date')
		.text(date)
		.at('text-anchor', 'middle')
		.at('y', -REM * 0.33);

	el.append('line').at({
		x1: 0,
		y1: 0,
		x2: 0,
		y2: LABEL_LINE_HEIGHT
	});
	return el;
}

function createPlayer({
	id,
	day,
	state = 1,
	speed = 1,
	off = true,
	showLabel = false
}) {
	const p = {
		id,
		speed,
		state,
		frame: 0,
		ticks: 0,
		x: off ? -PLAYER_W : scale(day),
		destX: scale(day),
		destDay: day,
		labelEl: createLabel({ id, showLabel, day })
	};
	players.push(p);
}
function popRecentPlayer() {
	const r = recentData.pop();
	players.forEach(p => p.labelEl.classed('is-visible', false));
	createPlayer({
		id: r.ago,
		day: r.day,
		state: 2,
		showLabel: true
	});
}

function setupCanvas() {
	const canvas = document.createElement('canvas');
	canvas.setAttribute('width', info.width);
	canvas.setAttribute('height', info.height);
	const context = canvas.getContext('2d');

	context.drawImage(
		info.img,
		0,
		0,
		info.width,
		info.height,
		0,
		0,
		info.width,
		info.height
	);

	// store canvas + context for later
	info.bufferCanvas = canvas;
	info.bufferContext = context;
	info.canvas = $.chartCanvas.node();
	info.context = $.chartCanvas.node().getContext('2d');
}

function setupSvg() {
	$.gLabel.at('transform', `translate(0,${SVG_HEIGHT - REM})`);
}

function setupPlayers() {
	createPlayer({
		id: 'Russell',
		day: RUSSELL_INDEX,
		off: false,
		state: 0,
		showLabel: true
	});
	const mid = Math.floor(365 / 2);
	createPlayer({ id: 'You', day: mid, off: false, state: 0, showLabel: true });
}

function resize(w) {
	width = w;
	scale.domain([0, 365]).range([PLAYER_W / 2, w - PLAYER_W / 2]);
	players.forEach(p => {
		p.destX = scale(p.destDay);
		p.x = scale(p.destDay);
	});
}

function setup({ recent, tally }) {
	recentData = recent;
	console.log(recentData);
	tallyData = tally;
	setupPlayers();
	loadImage('assets/img/test.png', (err, img) => {
		info.img = img;
		info.width = img.width;
		info.height = img.height;
		setupCanvas();
		setupSvg();
		tick();
	});
}

export default { setup, resize, updateUser, popRecentPlayer };
