import loadImage from './utils/load-image';
import $ from './dom';

const PLAYER_W = 32;
const PLAYER_H = 64;
const NUM_TICKS_PER_FRAME = 8;
const NUM_FRAMES = 4;
const STEP_PIXELS = 2;

const scale = d3.scaleLinear();
const info = {};
const players = [];
const timePrevious = 0;
// const framerate = 33;

let width = 0;

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
	if (p.moving) {
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
			p.moving = false;
		}
	}

	renderPlayer({
		srcX: p.frame,
		srcY: p.state,
		posX: p.x,
		posY: 0
	});
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
	const p = players.find(player => player.id === 'user');
	p.destDay = d;
	p.destX = scale(d);

	// moving left or right
	p.state = p.destX < p.x ? 1 : 2;
	p.moving = true;
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

function setupPlayers() {
	// state 0 = idle, 1 = left, 2 = right
	// players.push({
	// 	id: 'russell',
	// 	state: 0,
	// 	moving: false,
	// 	frame: 0,
	// 	x: scale(319),
	// 	destX: scale(319),
	// 	destDay: 319,
	// 	ticks: 0,
	// 	speed: 1
	// });

	const mid = Math.floor(365 / 2);
	players.push({
		id: 'user',
		state: 0,
		moving: false,
		frame: 0,
		x: scale(mid),
		destX: scale(mid),
		destDay: mid,
		ticks: 0,
		speed: 1
	});
}

function resize(w) {
	width = w;
	scale.domain([0, 365]).range([PLAYER_W / 2, w - PLAYER_W / 2]);
	players.forEach(p => {
		p.destX = scale(p.destDay);
		p.x = scale(p.destDay);
	});
}

function setup() {
	setupPlayers();
	loadImage('assets/img/test.png', (err, img) => {
		info.img = img;
		info.width = img.width;
		info.height = img.height;
		setupCanvas();
		tick();
	});
}

export default { setup, resize, updateUser };
