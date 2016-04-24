var Loopback = require('loopback');
var dcalc = require('./date-calculator');

module.exports = function(id, year, cb) {

	var result = [];
	//Getting expanses
	var ExpensesModel = Loopback.getModel('Expenses');

	var yearFirstDay = year + '-1-1';
	var yearLastDay = year + '-12-31';
	var filter = {
		where: { and:[ 
			{ realstateID: id },
			{ expenseDate: {gte: yearFirstDay} },
			{ expenseDate: {lte: yearLastDay} },
		]}
	};

	ExpensesModel.find(filter, function(err,expanses) {
		for (var month = 0; month < 12; month++) {
			var monthSum = 0;
			for (var i = 0; i < expanses.length; i++) {
				var exp = expanses[i];
				var monthFirstDay = dcalc.monthFirstDay(year, month);
				var monthLastDay = dcalc.monthLastDay(year, month);
				// expanses made within this month
				if(exp.expenseDate >= monthFirstDay && exp.expenseDate <= monthLastDay) {
					monthSum += exp.amount;
				}

			}
			result.push({
				month: month + 1,
				total: monthSum,
			});
		}
		cb(err, result);
	})

}