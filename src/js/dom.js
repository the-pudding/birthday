const content = d3.select('#content');

const graphic = content.select('.graphic');
const graphicText = graphic.select('.graphic__text');
const graphicChart = graphic.select('.graphic__chart');
const graphicUi = graphic.select('.graphic__ui');

const chartSvg = graphicChart.select('.chart__svg');
const chartCanvas = graphicChart.select('.chart__canvas');
const chartTimeline = graphicChart.select('.chart__timeline');
const chartBalloon = graphicChart.select('.chart__balloon');

const step = graphic.selectAll('.step');

const svgLabel = chartSvg.select('.svg__label');
const svgTally = chartSvg.select('.svg__tally');
const svgMath = chartSvg.select('.svg__math');
const mathInfo = chartSvg.select('.math__info');

const buttonNext = graphicUi.selectAll('button.next');
const buttonPrev = graphicUi.selectAll('button.prev');
const dropdown = graphicUi.select('.dropdown');
const slider = graphicUi.select('.slider');

const gLabel = svgLabel.select('.g-label');
const gTally = svgTally.select('.g-tally');

const sup = graphicText.selectAll('sup');
const note = graphicText.selectAll('.note');
const aboutBtn = d3.select('.about-btn');
const about = d3.select('#about');
const aboutClose = about.select('.about__close');

export default {
	content,
	graphic,
	graphicText,
	graphicChart,
	graphicUi,
	chartSvg,
	chartCanvas,
	chartTimeline,
	chartBalloon,
	step,
	dropdown,
	buttonNext,
	buttonPrev,
	slider,
	svgTally,
	svgLabel,
	gLabel,
	gTally,
	svgMath,
	mathInfo,
	sup,
	note,
	aboutBtn,
	about,
	aboutClose
};
