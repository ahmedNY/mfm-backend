var Loopback = require('loopback');
var Realstate = Loopback.getModel('Realstate')
var dcalc = require('./date-calculator');

// Calculating Realstate income
module.exports = function (id, year, cb) {
	Realstate.findById(id, function(err, instance){
		var Contract = Loopback.getModel('Contract');
        var Renewal = Loopback.getModel('Renewal');
        var result = [0,0,0,0,0,0,0,0,0,0,0,0];

        Contract.find(
            { 
                where : { realstateID: instance.id }, 
                include: ['renewals']
            }, function(err, contracts) { 

            for ( var month = 0; month < 12; month++ ) {
				for (var c = 0; c < contracts.length; c++) {
					var con = contracts[c];
                    //check if the start and end date convering the all month
                    var monthLastDay = dcalc.getDaysInMonth(month+1, year);
                    var rentalFees = con.grandTotal / con.durationInDays;

					// contract start on this month and will end on this month
					if( (con.startDate >= new Date(year, month, 1)) 
						&& (con.endDate <= new Date(year, month, monthLastDay))) {
						// diffrent betwen start and end
						result[month] += dcalc.daysDiff(con.startDate, con.endDate) * rentalFees;
					} 
					// contract started before this month and endded in this month
					else if( ( con.endDate >= new Date(year, month, 1) ) 
						&& (con.endDate <= new Date(year, month, monthLastDay))) {
						// diffrent btween first day of the month and end date
						result[month] += dcalc.daysDiff( new Date(year, month, 1), con.endDate ) * rentalFees;
					}
					// contract start on this month and end after this month
					else if( ( con.startDate >= new Date(year, month, 1) ) 
						&& (con.startDate <= new Date(year, month, monthLastDay))) {
						// diffrent between start date and last days of the month
						result[month] += dcalc.daysDiff( con.startDate, new Date(year, month, monthLastDay) ) * rentalFees;
					}
					// contract stared before this month and will end after this month
					else if( ( con.startDate <= new Date(year, month, 1) ) 
						&& (con.endDate >= new Date(year, month, monthLastDay))) {
						result[month] +=  monthLastDay  * rentalFees;
					}
				}
			}

            // Renewals 
            // 1. Get all renewals within year
            var yearFirstDay = year + '-1-1';
            var yearLastDay = year + '-12-31';

            var filter = {
                where : {
                    and: [
                        {or: [
                            { startDate: { lte: yearFirstDay }}, 
                            { startDate: { lte: yearLastDay}} 
                        ]},
                        {or: [
                            { endDate: { gte: yearFirstDay }}, 
                            { endDate: { gte: yearLastDay}} 
                    ]},
                    ]
                },
                include: ['contract']
            };

            Renewal.find(filter, function(err, renewals) {
                 for ( var month = 0; month < 12; month++ ) {
                    for (var r = 0; r < renewals.length; r++) {
                        var ren = renewals[r];

                        if (ren.__data.contract.__data.realstateID !== parseInt(id))
                            continue;

                        //check if the start and end date convering the all month
                        var monthFirstDay = new Date(year, month, 1, 12);
                        var monthLastDay = new Date(year, month, dcalc.getDaysInMonth(month+1, year), 12);
                        var rentalFees = ren.__data.contract.rentalFees;

                        // renewal start on this month and will end on this month
                        if( (ren.startDate >= monthFirstDay) 
                            && (ren.endDate <= monthLastDay)) {
                            // diffrent betwen start and end
                            result[month] += dcalc.daysDiff(ren.startDate, ren.endDate) * rentalFees;
                        } 
                        // renewal started before this month and endded in this month
                        else if( ( ren.endDate >= monthFirstDay)  
                            && (ren.endDate <= monthLastDay)) {
                            // diffrent btween first day of the month and end date
                            result[month] += dcalc.daysDiff( monthFirstDay, ren.endDate ) * rentalFees;
                        }
                        // renewal start on this month and end after this month
                        else if( ( ren.startDate >= monthFirstDay ) 
                            && (ren.startDate <= monthLastDay)) {
                            // diffrent between start date and last days of the month
                            result[month] += dcalc.daysDiff( ren.startDate, monthLastDay ) * rentalFees;
                        }
                        // renewal stared before this month and will end after this month
                        else if( ( ren.startDate <= monthFirstDay ) 
                            && (ren.endDate >= monthLastDay)) {
                            result[month] +=  monthLastDay  * rentalFees;
                        }
                    }
                }
                var formattedResult = [];
                for(var m = 0; m < result.length; m++) {
                    formattedResult.push({
                        month: m+1,
                        total:result[m]
                    });
                }
                cb(err, formattedResult);
            })
		}); //EOF contracts

        
	})

};
