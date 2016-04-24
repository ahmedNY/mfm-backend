var Loopback = require('loopback');
var _ = require('underscore');
var dcalc = require('./date-calculator');

var RealstateIncome = require('./realstate-income');
var RealstateIncomeDetails = require('./realstate-income-details'); 
var RealstateExpenses = require('./realstate-expenses');
var RealstateExpenseDetails = require('./realstate-expense-details');

module.exports = function(Realstate) {
	// Adding the ramaining days property to realstate 
	Realstate.observe('loaded', function (ctx, next) {
	  if (ctx.instance) {
	    var timeDiff = Math.abs(new Date(ctx.instance.endDate).getTime() - new Date().getTime());
        ctx.instance.remainingDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
	    return next();

	  } else {
	    return next();
	  }
	});

    //Income summary
    Realstate.income = RealstateIncome;
    //Income details
    Realstate.incomeDetails = RealstateIncomeDetails;
    //Expanses summary
    Realstate.expenses = RealstateExpenses;
    //Expanse details
    Realstate.expenseDetails = RealstateExpenseDetails;
    

    Realstate.remoteMethod(
        'income',
        {
            http: { verb: 'get' },
            description: 'Get income summary',
            accepts: [	
            			{ arg: 'id', type: 'array', required: true }, 
            			{ arg: 'year', type: 'string', required: true } 
            		],
            returns: { arg: 'data', type: ['Realstate'], root: true }
        }
    );

    Realstate.remoteMethod(
        'incomeDetails',
        {
            http: { verb: 'get' },
            description: 'Get income details',
            accepts: [  
                        { arg: 'id', type: 'string', required: true }, 
                        { arg: 'year', type: 'string', required: true },
                        { arg: 'month', type: 'string', required: true },
                    ],
            returns: { arg: 'data', type: ['Realstate'], root: true }
        }
    );   

    Realstate.remoteMethod(
        'expenses',
        {
            http: { verb: 'get' },
            description: 'Get expanses summary',
            accepts: [  
                        { arg: 'id', type: 'string', required: true }, 
                        { arg: 'year', type: 'string', required: true },
                    ],
            returns: { arg: 'data', type: ['Realstate'], root: true }
        }
    );

    Realstate.remoteMethod(
        'expenseDetails',
        {
            http: { verb: 'get' },
            description: 'Get expanses details',
            accepts: [	
            			{ arg: 'id', type: 'string', required: true }, 
                        { arg: 'year', type: 'string', required: true },
            			{ arg: 'month', type: 'string', required: true },
            		],
            returns: { arg: 'data', type: ['Realstate'], root: true }
        }
    );

};
