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
    
    var currentMetaListTarget = [];
    var currentMetaListSource = [];
    
    var keys = [];
    //comparison class by class
    _.each(mSourceElements,function(elements,id){
      //  console.log(id);
        keys.push(id);
        mSourceMetrics.set(id,elements.length);
        currentMetaListSource.push(elements);
     }); 
    
    _.each(mTargetElements,function(elements,id){
        mTargetMetrics.set(id,elements.length);
        currentMetaListTarget.push(elements);
    });
   
    
    _.each(keys,function(i) {
          var zipped = _.zip(mSourceElements[i],mTargetElements[i]);
            _.map(zipped,function(pair){
                //console.log(pair[0]);
               var keys= Object.keys(pair[1].conformsTo().getAllAttributes());
                 _.each(keys, function(attName) {
                     if(pair[0]!==undefined) {
                        console.log(pair[0][attName],' : ',pair[1][attName]);
                     }
                });
            })
          
              //  _.each(Object.keys(elems.conformsTo().getAllAttributes()), function(attName) {  
                   // console.log(attName,elems[attName]);
            //    });
    });
    
            //console.log(id,'  ',i, ' : ')//,currentTarget,currentSource);
          /*  _.each(Object.keys(currentTarget.conformsTo().getAllAttributes()), function(attName) {
                if(currentSource!==undefined) {
                    //console.log(attName,currentTarget[attName],currentSource[attName]);
          */
       /* _(mSourceElements[id]).each(function(jsmfS,id2){
            _(mTargetElements[id]).each(function(jsmfT,id3){
               // compareModelElement(jsmfS,jsmfT);
            });
        }); */
    
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