var moment = require('moment');

function getDaysInMonth(m, y) {
    return m===2 ? y & 3 || !(y%25) && y & 15 ? 28 : 29 : 30 + (m+(m>>3)&1);
}

function daysDiff(_a, _b) {
	var a = moment(_a);
	var b = moment(_b);
	var diffDays = Math.round(b.diff(a, 'days', true));
	console.log(diffDays);
	return diffDays;
}

function monthFirstDay(year, month){
	return new Date(year, month, 1, 12);
}

function monthLastDay(year, month){
	return  new Date(year, month, getDaysInMonth(month+1, year), 12);
}


module.exports.getDaysInMonth =  getDaysInMonth;
module.exports.daysDiff = daysDiff;

module.exports.monthFirstDay = monthFirstDay;
module.exports.monthLastDay = monthLastDay;