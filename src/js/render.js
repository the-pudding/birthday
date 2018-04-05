import loadImage from './utils/load-image';
import $ from './dom';
import flattenMonthData from './flatten-month-data';
import whichAnimationnEvent from './which-animation-event';

const dayData = flattenMonthData();
const animationEvent = whichAnimationnEvent();
const SPRITES = ['red', 'yellow', 'green', 'blue', 'purple', 'white'];

const BP = 600;
const NUM_TICKS_PER_FRAME = 8;
const NUM_FRAMES = 4;
const STEP_PIXELS = 2;
const REM = 16;
const RUSSELL_INDEX = 319;
const SVG_HEIGHT = REM * 10;
const FRAME_RATE = 125;
const SPECIAL_IDS = ['Russell', 'You'];
const DPR = Math.min(window.devicePixelRatio, 2);

const scale = d3.scaleLinear();
const info = {};
let players = [];

let timePrevious = 0;
let skinFrame = 0;
let width = 0;
const $label = null;

const rawW = 32;
const rawH = 70;
let playerW = rawW;
let playerH = rawH;

const special = [];

function clearContext() {
	info.context.clearRect(0, 0, info.canvas.width, info.canvas.height);
}

function renderPlayer({ srcX, srcY, posX, posY, alpha, skin }) {
	info.context.globalAlpha = alpha;
	info.context.drawImage(
		info.bufferCanvas[skin],
		srcX * rawW * 2,
		srcY * rawH * 2,
		rawW * 2,
		rawH * 2,
		Math.floor(posX - playerW / 2),
		posY,
		playerW,
		playerH
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

function removeBalloon() {
	d3.select(this).remove();
}

function createBalloon(p) {
	p.balloon = false;
	p.rainbow = true;
	p.alpha = 1;
	const left = scale(p.destDay);

	$.chartBalloon
		.append('p.balloon')
		.text('🎈')
		.st({ left })
		.classed('is-float', true)
		.on(animationEvent, removeBalloon);
}

function updateLabel(p, exact) {
	const i = Math.floor(scale.invert(p.x));
	const index = exact ? p.destDay : Math.min(Math.max(i, 0), dayData.length);
	const { month, day } = dayData[index];
	p.labelEl.select('.date').text(`${month.substring(0, 3)} ${day}`);
}

function updatePlayer(p) {
	if (p.state) {
		// frame animation
		p.ticks += 1;
		checkUpdateFrame(p);

		// move player
		const rate = STEP_PIXELS * p.speed;
		p.x += rate * (p.state === 2 ? 1 : -1);

		// update label
		if (SPECIAL_IDS.includes(p.id)) updateLabel(p);

		// stop moving
		const diff = p.destX - p.x;
		const doneLeft = p.state === 1 && diff > 0;
		const doneRight = p.state === 2 && diff < 0;
		if (doneLeft || doneRight) {
			p.x = p.destX;
			p.state = 0;
			p.frame = 0;
			if (!SPECIAL_IDS.includes(p.id)) p.labelEl.classed('is-visible', false);
			else updateLabel(p, true);
			if (p.cb && typeof p.cb === 'function') {
				p.cb();
				p.cb = null;
			}
			if (p.balloon) createBalloon(p);
		}
	} else if (p.balloon) createBalloon(p);

	renderPlayer({
		srcX: p.rainbow ? 1 : p.frame,
		srcY: p.state,
		posX: p.x,
		posY: 0,
		alpha: p.alpha,
		skin: p.skin
	});

	p.labelEl.st('left', p.x);
}
function tick() {
	const timeCurrent = d3.now();
	const timeElapsed = timeCurrent - timePrevious;
	if (timeElapsed > FRAME_RATE) {
		timePrevious = timeCurrent;
		skinFrame += 1;
		if (skinFrame >= SPRITES.length) skinFrame = 0;
	}
	clearContext();
	players.forEach(updatePlayer);
	window.requestAnimationFrame(tick);
}

function updateUser({ id, day }) {
	const p = players.find(player => player.id === id);
	p.destDay = day;
	p.destX = scale(day);

	const match = dayData[day];
	const date = `${match.month.substring(0, 3)} ${match.day}`;
	p.labelEl.select('.date').text(date);
	// moving left or right
	p.state = p.destX < p.x ? 1 : 2;
}

function highlight() {
	players.sort((a, b) =>
		d3.ascending(a.rainbow || a.balloon, b.rainbow || b.balloon)
	);

	players.forEach(p => {
		p.skin = p.rainbow || p.balloon ? p.skin : SPRITES.length - 1;
		p.alpha = p.rainbow || p.balloon ? 1 : 0.5;
	});
}

function showBirthday(id) {
	const p = players.find(d => d.id === id);
	if (p) p.labelEl.select('.date').classed('is-visible', true);
}

function hideSpecialLabels() {
	players.forEach(p => p.labelEl.classed('is-visible', false));
}

function createLabel({ id, showLabel, day, showBirth = true }) {
	const match = dayData[day];
	const date = `${match.month.substring(0, 3)} ${match.day}`;
	const el = $.svgLabel.append('div.label');
	el.classed('is-visible', showLabel);

	el
		.append('p.date')
		.text(date)
		.classed('is-visible', showBirth);

	el.append('p.id').text(id);

	return el;
}

function createPlayer({
	id,
	day,
	state = 0,
	speed = 1,
	off = true,
	showLabel = false,
	alpha = 1,
	cb = null,
	balloon = false,
	showBirth = true,
	skin
}) {
	const p = {
		id,
		speed,
		state,
		alpha,
		balloon,
		skin,
		frame: 0,
		ticks: 0,
		x: off ? -playerW * 2 : scale(day),
		destX: scale(day),
		destDay: day,
		labelEl: createLabel({ id, showLabel, day, showBirth }),
		cb
	};
	players.push(p);
	if (SPECIAL_IDS.includes(id)) special.push(p);
}

function showBigTwo() {
	if (!players.length) {
		players = [].concat(special);
		players.forEach((p, i) => {
			p.labelEl = createLabel({ id: p.id, showLabel: true, day: p.destDay });
			p.alpha = 1;
			p.skin = i;
		});
	}
}

function addRecentPlayer(
	{ player, speed = 1, balloon = false, hideLabel = false, alpha = 0.67, skin },
	cb = null
) {
	const showLabel = hideLabel ? false : speed < 4;
	const off = speed < 64;
	const state = speed < 64 ? 2 : 0;
	createPlayer({
		id: player.ago,
		day: player.day,
		state,
		off,
		showLabel,
		speed,
		alpha,
		balloon,
		skin,
		cb
	});
}

function removePlayers() {
	players = [];
	$.svgLabel.selectAll('.label').remove();
}

function setupCanvas() {
	info.bufferCanvas = [];
	info.bufferContext = [];

	SPRITES.forEach((sprite, i) => {
		const canvas = document.createElement('canvas');
		canvas.setAttribute('width', info.width);
		canvas.setAttribute('height', info.height);
		const context = canvas.getContext('2d');

		context.drawImage(
			info.sprites[i],
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
		info.bufferCanvas.push(canvas);
		info.bufferContext.push(context);
	});

	info.canvas = $.chartCanvas.node();
	info.context = $.chartCanvas.node().getContext('2d');
}

function setupSvg() {
	// $.gLabel.at('transform', `translate(0,${SVG_HEIGHT - REM})`);
}

function setupPlayers() {
	createPlayer({
		id: 'Russell',
		day: RUSSELL_INDEX,
		off: false,
		showLabel: true,
		showBirth: false,
		alpha: 1,
		skin: 0
	});
	const mid = Math.floor(365 / 2);
	createPlayer({
		id: 'You',
		day: mid,
		off: false,
		showLabel: true,
		alpha: 1,
		skin: 1
	});
}

function resize({ w, p }) {
	playerW = p.playerW;
	playerH = p.playerH;

	width = w;

	scale.domain([0, 365]).range([playerW / 2, w - playerW / 2]);
	players.forEach(p => {
		p.destX = scale(p.destDay);
		p.x = scale(p.destDay);
	});
}

function loadSprites(cb) {
	const imgs = [];
	let i = 0;
	const next = () => {
		loadImage(`assets/img/${SPRITES[i]}.png`, (err, img) => {
			imgs.push(img);
			i++;
			if (i < SPRITES.length) next();
			else cb(imgs);
		});
	};
	next();
}
function setup(cb) {
	setupPlayers();
	loadSprites(imgs => {
		info.sprites = imgs;
		info.width = imgs[0].width;
		info.height = imgs[0].height;
		setupCanvas();
		setupSvg();
		tick();
		cb();
	});
}

export default {
	setup,
	resize,
	updateUser,
	addRecentPlayer,
	removePlayers,
	hideSpecialLabels,
	showBirthday,
	createBalloon,
	showBigTwo,
	highlight
};
