var Loopback = require('loopback');

module.exports = function(Renewal) {
	// ------------------- AFTER DELETE ----------------------
	Renewal.observe('before delete', function(ctx, next) {

	  	var Realstate = Loopback.getModel('Realstate');
	  	var Contract = Loopback.getModel('Contract');

	  	var renewalId = ctx.where.id;
	  	// get the renewal
	  	Renewal.findById(renewalId, function(err, renewal) {
	  		
	  		console.log('-----------------------------------');
	  	  	console.log(JSON.stringify(renewal));
		  	// get all contracts of 
		  	var lastEndDate;

	  	  	Contract.findById(renewal.contractID, 
	  	  		{ 
	  	  			include: 'renewals'
	  	  		}, 
	  	  		function(err, contract)
	  	  	{
	  	  		console.log('-----------------------------------');
	  	  		console.log(JSON.stringify(contract));
    			latestEndDate = contract.endDate;
    			var renewals = contract.renewals();
    			var length = renewals.length;
    			if(length >= 2) { 
    		    	latestEndDate = renewals[contract.renewals.length-2].endDate;
    		    }
	  		  	Realstate.findById(contract.realstateID, function(err, realstate){
	  		  		// end date either contract or
	  		    	realstate.endDate = latestEndDate;
	  		    	realstate.save();
	  				next();
	  	  		});
	  		});
	  		
	  	}); 
	  	// take the

	  	// set realstate.endDate to contract.endDate or latest renewal.endDate


	});
	// ------------------- AFTER SAVE ------------------------
	Renewal.observe('after save', function(ctx, next)
	{
		var Realstate = Loopback.getModel('Realstate');
		var Contract = Loopback.getModel('Contract');
		if (ctx.instance){
		 	// update real state end date
		  	Contract.findById(ctx.instance.contractID, function(err, contract){
			  	Realstate.findById(contract.realstateID, function(err, realstate){
			    	realstate.endDate = ctx.instance.endDate;
			    	realstate.save(function(){
				      	console.log('realstate update without errors.')
			    })
		  	});
		  })
		}

		next();
	});
	
}


function compare(a, b){
	if(a.endDate > b.endDate)
		return 1;
	else if (a.endDate < b.endDate)
		return -1;
	else 
		return 0;
}