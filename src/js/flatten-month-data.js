import monthData from './month-data';

export default function setupDayData() {
	const output = [];
	monthData.forEach(month => {
		d3.range(month.days).forEach(day => {
			output.push({ month: month.name, day: day + 1 });
		});
	});
	return output;
}
