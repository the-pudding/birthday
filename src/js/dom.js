const content = d3.select('#content');

const graphic = content.select('.graphic');
const graphicText = graphic.select('.graphic__text');
const graphicChart = graphic.select('.graphic__chart');
const graphicUi = graphic.select('.graphic__ui');

const chartSvg = graphicChart.select('.chart__svg');
const chartCanvas = graphicChart.select('.chart__canvas');
const chartTimeline = graphicChart.select('.chart__timeline');

const step = graphic.selectAll('.step');

const uiButton = graphicUi.selectAll('button');
const dropdown = graphicUi.select('.dropdown');
const slider = graphicUi.select('.slider');

const gLabel = chartSvg.select('.g-label');
const gArc = chartSvg.select('.g-arc');

export default {
	content,
	graphic,
	graphicText,
	graphicChart,
	graphicUi,
	chartSvg,
	chartCanvas,
	chartTimeline,
	step,
	dropdown,
	uiButton,
	gLabel,
	gArc,
	slider
};
