module.exports = function(Realstate) {
	Realstate.observe('loaded', function (ctx, next) {
	  if (ctx.instance) {
	    // var remainingDays = 0;
	    var timeDiff = Math.abs(new Date(ctx.instance.endDate).getTime() - new Date().getTime());
        ctx.instance.remainingDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
	    return next();

	    // either from contract or from renewals

	  //   Realstate.app.models.Contract.find({
	  //   	where: {
	  //       	realstateID: ctx.instance.id
	  //     	},
	  //     	fields: {
	  //       	endDate: true
	  //     	},
	  //     	order: 'contractDate DESC',
			// limit: 1,
	  //   }, function (err, contracts) {
	  //     if (err) return next(err);
	  //     	console.log(JSON.stringify(contracts));
	  //     if (contracts.length) {
   //        	var timeDiff = Math.abs(new Date(contracts[0].endDate).getTime() - new Date().getTime());
   //        	remainingDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 

	  //       ctx.instance.remainingDays = remainingDays;
	  //     } else {
	  //       ctx.instance.remainingDays = 0;
	  //     }

	      // return next();
	  //   });

	  } else {
	    return next();
	  }
	});
};
