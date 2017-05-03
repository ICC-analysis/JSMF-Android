'use strict'
var jsmf = require('jsmf-core'),
    Class = jsmf.Class, Model = jsmf.Model;

var _ =require('lodash');

function compare(ModelSource,ModelTarget) {
    
    //Compute values
    //console.log(ModelSource);
    
    const mSourceElements = ModelSource.modellingElements;
    const mTargetElements = ModelTarget.modellingElements;
    
    var mSourceMetrics = new Map();
    var mTargetMetrics = new Map();
    //comparison class by class
    _.each(mSourceElements,function(elements,id){
        mSourceMetrics.set(id,elements.length);
        
        //WARNING: To be changed...
        //we know that mTargetElements have more elements than original (source)... but it may not be always the case
        for(var i in mTargetElements[id]) {
            var currentTarget = mTargetElements[id][i];
            var currentSource = mSourceElements[id][i];
           // console.log(id,'  ',i, ' : ',currentTarget,currentSource);
            _.each(Object.keys(currentTarget.conformsTo().getAllAttributes()), function(attName) {
                if(currentSource!==undefined) {
                    console.log(attName,currentTarget[attName],currentSource[attName]);
                } else
            });
           // console.log(_.pick(currentTarget,));
        }
        _(mSourceElements[id]).each(function(jsmfS,id2){
            _(mTargetElements[id]).each(function(jsmfT,id3){
               // compareModelElement(jsmfS,jsmfT);
            });
        });
    });
    
    _.each(mTargetElements,function(elements,id){
        mTargetMetrics.set(id,elements.length);
    });
    
    return ({"sourceMetrics": mSourceMetrics,"targetMetrics":mTargetMetrics});
}


function compareModelElement(elSource,elTarget) {
       console.log(_.pick(elSource,Object.keys(elSource.conformsTo().getAllAttributes())));
   return  true;
}
//function dryModel(c) {
  //return _.assign({__jsmf: {uuid: jsmf.jsmfId(c)}}, _.pick(c, ['__name', 'referenceModel', 'modellingElements']))
//}

module.exports = {
    compare: compare
} 