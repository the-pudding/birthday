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

const uiButton = graphicUi.selectAll('button');
const dropdown = graphicUi.select('.dropdown');
const slider = graphicUi.select('.slider');

const gLabel = svgLabel.select('.g-label');
const gTally = svgTally.select('.g-tally');

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
	uiButton,
	slider,
	svgTally,
	svgLabel,
	gLabel,
	gTally
};
