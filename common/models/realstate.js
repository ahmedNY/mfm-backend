var Loopback = require('loopback');
var moment = require('moment');
var _ = require('underscore');

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
                        var monthLastDay = getDaysInMonth(month+1, year);
                        var rentalFees = con.grandTotal / con.durationInDays;

						// contract start on this month and will end on this month
						if( (con.startDate >= new Date(year, month, 1)) 
							&& (con.endDate <= new Date(year, month, monthLastDay))) {
							// diffrent betwen start and end
							result[month] += daysDiff(con.startDate, con.endDate) * rentalFees;
						} 
						// contract started before this month and endded in this month
						else if( ( con.endDate >= new Date(year, month, 1) ) 
							&& (con.endDate <= new Date(year, month, monthLastDay))) {
							// diffrent btween first day of the month and end date
							result[month] += daysDiff( new Date(year, month, 1), con.endDate ) * rentalFees;
						}
						// contract start on this month and end after this month
						else if( ( con.startDate >= new Date(year, month, 1) ) 
							&& (con.startDate <= new Date(year, month, monthLastDay))) {
							// diffrent between start date and last days of the month
							result[month] += daysDiff( con.startDate, new Date(year, month, monthLastDay) ) * rentalFees;
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
                            var monthLastDay = new Date(year, month, getDaysInMonth(month+1, year), 12);
                            var rentalFees = ren.__data.contract.rentalFees;

                            // renewal start on this month and will end on this month
                            if( (ren.startDate >= monthFirstDay) 
                                && (ren.endDate <= monthLastDay)) {
                                // diffrent betwen start and end
                                result[month] += daysDiff(ren.startDate, ren.endDate) * rentalFees;
                            } 
                            // renewal started before this month and endded in this month
                            else if( ( ren.endDate >= monthFirstDay)  
                                && (ren.endDate <= monthLastDay)) {
                                // diffrent btween first day of the month and end date
                                result[month] += daysDiff( monthFirstDay, ren.endDate ) * rentalFees;
                            }
                            // renewal start on this month and end after this month
                            else if( ( ren.startDate >= monthFirstDay ) 
                                && (ren.startDate <= monthLastDay)) {
                                // diffrent between start date and last days of the month
                                result[month] += daysDiff( ren.startDate, monthLastDay ) * rentalFees;
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

    // Income details
    Realstate.incomeDetails = function(id, year, month, cb) {
    	var Contract = Loopback.getModel('Contract');
    	var monthFirstDay = year + '-' + month + '-' + '1';
		var monthLastDay = year + '-' + month + '-' + getDaysInMonth(parseInt(month), parseInt(year));
    	Contract.find({
    		where : { and :[
					{ realstateID: id }, 
					{
						and: [
							{or: [
							{ startDate: { lte: monthFirstDay }}, 
							{ startDate: { lte: monthLastDay}} 
							]},
							{or: [
							{ endDate: { gte: monthFirstDay }}, 
							{ endDate: { gte: monthLastDay}} 
						]},
						]
					}
					]},
    	}, function(err, contracts){

    		var monthSum = 0;
    		var result = {
    			monthSum: monthSum,
    			details: []
    		};

    		// list of contract id's used on renwals filtering
    		var contractIDsList = [];

    		for(var c = 0; c < contracts.length; c++) {
    			var con = contracts[c];
    			var contract = {};

    			//Duration
    			monthFirstDay = new Date(year, month-1, 1, 12);
    			monthLastDay = new Date(year, month-1, getDaysInMonth(parseInt(month), parseInt(year)), 12);
    			var startDate = con.startDate;
    			var endDate = con.endDate; // RENEWALS!!!!!
    			
    			// contract start date within month days
    			if(startDate >= monthFirstDay && startDate <= monthLastDay) {
    				contract.startDate = startDate;
    			} else {
    				contract.startDate = monthFirstDay;
    			}
    			
    			// contract end date within month days
    			if(endDate > monthFirstDay && endDate <= monthLastDay) {
    				contract.endDate = endDate;
    			} else {
    				contract.endDate = monthLastDay;
    			}


                //Amount - witout brokers or renwals
                contract.amount = (con.grandTotal / con.durationInDays) * daysDiff(contract.startDate, contract.endDate);
                
                // special case
                // if the entire month were buzy
                if(contract.startDate === monthFirstDay && contract.endDate === monthLastDay) {
    			     contract.amount = (con.grandTotal / con.durationInDays) * getDaysInMonth(parseInt(month), parseInt(year));
                }
    			
                monthSum += contract.amount;
    			
    			// adding contract id to detail
    			contract.contractID = con.id;
    			
    			contractIDsList.push(con.id);

    			result.details.push(contract);
    		}

    		// Renewals 
    		var Renewal = Loopback.getModel('Renewal');

    		var filter = {
	    		where : {
							and: [
								{or: [
								{ startDate: { lte: monthFirstDay }}, 
								{ startDate: { lte: monthLastDay}} 
								]},
								{or: [
								{ endDate: { gte: monthFirstDay }}, 
								{ endDate: { gte: monthLastDay}} 
							]},
							]
						},
	    		include: ['contract']
    		};

    		Renewal.find(filter, function(err, renewals) {

    			for (var r = 0; r < renewals.length; r++) {
    				var renewal = renewals[r];
    				var ren = {};
    				if (renewal.__data.contract.__data.realstateID !== parseInt(id))
    					continue;
                    
                    monthFirstDay = new Date(year, month-1, 1, 12);
                    monthLastDay = new Date(year, month-1, getDaysInMonth(parseInt(month), parseInt(year)), 12);

    				// renewal start date within month days
    				if(renewal.startDate >= monthFirstDay && renewal.startDate <= monthLastDay) {
    					ren.startDate = renewal.startDate;
    				} else {
    					ren.startDate = monthFirstDay;
    				}
    				
    				// renewal end date within month days
    				if(renewal.endDate > monthFirstDay && renewal.endDate <= monthLastDay) {
    					ren.endDate = renewal.endDate;
    				} else {
    					ren.endDate = monthLastDay;
    				}

    				ren.renewalID = renewal.id;
    				ren.amount = daysDiff(ren.startDate, ren.endDate) * renewal.__data.contract.rentalFees;

    				result.details.push(ren);
    				monthSum += ren.amount;
    			}
	    		result.monthSum = monthSum;
                result.details = _.sortBy(result.details, function(o) {
                    return o.startDate;
                })
	    		cb(err, result);
    		})


    	});
    }

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
            			{ arg: 'month', type: 'string', required: true } 
            		],
            returns: { arg: 'data', type: ['Realstate'], root: true }
        }
    );

};
