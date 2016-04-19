var Loopback = require('loopback');
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

	// Calculating Realstate income
	Realstate.income = function (id, year, cb) {
		Realstate.findById(id, function(err, instance){
			var rentalFees = instance.rentalFees;
    		var Contract = Loopback.getModel('Contract');
    		Contract.find(
    			{ 
    				where : { realstateID: instance.id }, 
    				include: ['renewals']
    			}, function(err, contracts) { 
    			var result = [];
    			// 2016
				for ( var month = 0; month < 12; month++ ) {
					var monthSum = 0;
					var allDays = false; // means all days of the month were busy
					for (var c = 0; c < contracts.length; c++) {
						var con = contracts[c];
						//check if the start and end date convering the all month
						var monthLastDay = getDaysInMonth(month+1, year);
						console.log('renewals')
						console.log(con);
						var endDate = con.endDate;
						if(con.__data.renewals.length > 0) {
							endDate = con.__data.renewals[con.__data.renewals.length-1].endDate;
						}

						// contract start on this month and will end on this month
						if( (con.startDate >= new Date(year, month, 1)) 
							&& (endDate <= new Date(year, month, monthLastDay))) {
							// diffrent betwen start and end
							monthSum += daysDiff(con.startDate, endDate) * rentalFees;
						} 
						// contract started before this month and endded in this month
						else if( ( endDate >= new Date(year, month, 1) ) 
							&& (endDate <= new Date(year, month, monthLastDay))) {
							// diffrent btween first day of the month and end date
							monthSum += daysDiff( new Date(year, month, 1), endDate ) * rentalFees;
						}
						// contract start on this month and end after this month
						else if( ( con.startDate >= new Date(year, month, 1) ) 
							&& (con.startDate <= new Date(year, month, monthLastDay))) {
							// diffrent between start date and last days of the month
							monthSum += daysDiff( con.startDate, new Date(year, month, monthLastDay) ) * rentalFees;
						}
						// contract stared before this month and will end after this month
						else if( ( con.startDate <= new Date(year, month, 1) ) 
							&& (endDate >= new Date(year, month, monthLastDay))) {
							monthSum +=  monthLastDay  * rentalFees;
							allDays = true;
						}
					}
					result.push({ month: month + 1, total: monthSum, allDays: allDays});
				}
				// console.log(result);
            	cb(err, result);
    		});
		})
	
    };

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

};
