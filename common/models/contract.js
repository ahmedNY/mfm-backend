var Loopback = require('loopback');
module.exports = function(Contract) {
  Contract.observe('after save', function(ctx, next){
  if (ctx.instance){
    console.log('Saved %s#%s', ctx.Model.modelName, ctx.instance.id);
    var Realstate = Loopback.getModel('Realstate');
    console.log(Realstate);
    Realstate.findById(ctx.instance.realstateID, function(err, realstate){
      realstate.state = 'full';
      realstate.endDate = ctx.instance.endDate;
      realstate.save(function(){
        console.log('realstate update without errors.')
      })
    })
  }
  else
    console.log('Updated %s matching %j', ctx.Model.pluralModelName, ctx.where);

  next();
  });
};
