var Loopback = require('loopback');
var dcalc = require('./date-calculator');

module.exports = function(id, year, month, cb) {

	var result = {
		monthSum: 0,
		details: []
	};
	//Getting expanses
	var ExpensesModel = Loopback.getModel('Expenses');
	
	var monthFirstDay = dcalc.monthFirstDay(year, month-1);
	var monthLastDay = dcalc.monthLastDay(year, month-1);

	var filter = {
		where: { and:[ 
			{ realstateID: id },
			{ expenseDate: {gte: monthFirstDay} },
			{ expenseDate: {lte: monthLastDay} },
		]}
	};

	ExpensesModel.find(filter, function(err,expanses) {

		for (var i = 0; i < expanses.length; i++) {
			var exp = expanses[i];
			// expanses made within this month
			result.monthSum += exp.amount;
			result.details.push({
				expenseID: exp.id,
				expenseDate: exp.expenseDate,
				description: exp.description,
				amount: exp.amount,
			});
		}

		cb(err, result);
	})

}