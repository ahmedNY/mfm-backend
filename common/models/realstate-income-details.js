var Loopback = require('loopback');
var Realstate = Loopback.getModel('Realstate');
var dcalc = require('./date-calculator');
var _ = require('underscore');


// Income details
module.exports = function(id, year, month, cb) {
	var Contract = Loopback.getModel('Contract');
	var monthFirstDay = year + '-' + month + '-' + '1';
	var monthLastDay = year + '-' + month + '-' + dcalc.getDaysInMonth(parseInt(month), parseInt(year));
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
		
		if(err){
			console.log(err);
			cb(err, err);
			return;
		}

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
			monthLastDay = new Date(year, month-1, dcalc.getDaysInMonth(parseInt(month), parseInt(year)), 12);
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
            contract.amount = (con.grandTotal / con.durationInDays) * dcalc.daysDiff(contract.startDate, contract.endDate);
            
            // special case
            // if the entire month were buzy
            if(contract.startDate === monthFirstDay && contract.endDate === monthLastDay) {
			     contract.amount = (con.grandTotal / con.durationInDays) * dcalc.getDaysInMonth(parseInt(month), parseInt(year));
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
                monthLastDay = new Date(year, month-1, dcalc.getDaysInMonth(parseInt(month), parseInt(year)), 12);

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
				ren.amount = dcalc.daysDiff(ren.startDate, ren.endDate) * renewal.__data.contract.rentalFees;

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