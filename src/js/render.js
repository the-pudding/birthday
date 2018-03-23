import loadImage from './utils/load-image';
import $ from './dom';

const PLAYER_W = 32;
const PLAYER_H = 64;
const NUM_TICKS_PER_FRAME = 8;
const NUM_FRAMES = 4;
const STEP_PIXELS = 2;

const info = {};
const players = [];
const timePrevious = 0;
// const framerate = 33;

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
		posX,
		posY,
		PLAYER_W,
		PLAYER_H
	);
}

function updatePlayer(player) {
	player.ticks += 1;
	const target = Math.floor(NUM_TICKS_PER_FRAME / player.speed);
	if (player.ticks % target === target - 1) {
		player.frame += 1;
		if (player.frame >= NUM_FRAMES) player.frame = 0;
		if (player.state === 0 && player.frame > 1) player.frame = 0;
		player.ticks = 0;
	}
	player.x += STEP_PIXELS * player.speed;

	renderPlayer({
		srcX: player.frame,
		srcY: player.state,
		posX: player.x,
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
	players.push({
		id: 'russell',
		state: 2, // 0 = idle, 1 = left, 2 = right
		frame: 0,
		x: 0,
		ticks: 0,
		speed: 1
	});
}

function setup() {
	loadImage('assets/img/test.png', (err, img) => {
		info.img = img;
		info.width = img.width;
		info.height = img.height;
		setupCanvas();
		setupPlayers();
		tick();
	});
}

export default { setup };
