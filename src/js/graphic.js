// D3 is included by globally by default
import db from './db';
import flattenMonthData from './flatten-month-data';
// import monthData from './month-data';

const dayData = flattenMonthData();
let rawData = null;

const $content = d3.select('#content');

let width = 0;
let height = 0;

const VERSION = new Date().getTime();
const DATA_URL = `https://pudding.cool/2018/04/birthday-data/data.json?version=${VERSION}`;

function updateDimensions() {
	width = $content.node().offsetWidth;
	height = window.innerHeight;
	$content.st('height', height);
}

function resize() {}

function init() {
	updateDimensions();
	d3.loadData(DATA_URL, (err, resp) => {
		rawData = resp[0];
		// db.setup();
		resize();
	});
}

export default { init, resize };
