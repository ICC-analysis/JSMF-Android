'use strict'
var jsmf = require('jsmf-core'),
    Class = jsmf.Class, Model = jsmf.Model;

var _ =require('lodash');

//Compare models with same/similar (i.e., with same name, not necessarily full similar signature) metamodels 
function compare(ModelSource,ModelTarget) {
    
    //Compute values
    //console.log(ModelSource);
    
    const mSourceElements = ModelSource.modellingElements;
    const mTargetElements = ModelTarget.modellingElements;
    
    var mSourceMetrics = new Map();
    var mTargetMetrics = new Map();
    
    var keys = [];
    
    var sameSimilar = [];
    
    //comparison class by class
    _.each(mSourceElements,function(elements,id){
        //assuming they have the same classes
        console.log(id);
        mSourceMetrics.set(id,elements.length);
        _.each(elements,function(elem){
         //  var currentlnormal = normalizeModelElements(elem);
            _.each(mTargetElements[id], function(target) {
                
                //Assumption: Objects have the same metamodel... should be tested before
                var diff = modelElementDifference(elem,target);
                const diflen= diff.length;
               
                if(diflen!==0) {
                    //console.log('diff ',elem.name, ' : ', target.name, '/ ', diff);
                    //compute too "much" difference (heuristic) -> see with bayesian approach
                    var attributeKeys = Object.keys(elem.conformsTo().getAllAttributes());
                  
                        // if some attributes are common =>threshold 50%?
                        if(diflen<=(attributeKeys.length/2)) {
                        console.log('Similar');
                        sameSimilar.push({type:'diff',src:elem,tgt:target,meta:id,diff:diff});
                        } else {
                            //if all attributes are different => different modelling elements
                            console.log('too much difference: probably not the same elements');
                        }
                    
                } else {
                    console.log('Same Objects');
                    sameSimilar.push({type:'same',src: elem, tgt: target, meta:id,diff:[]});
                    //Similar checked : add tuple source/target to list as similar
                }
            });
           
        });
     }); 
    
    
    _.each(mTargetElements,function(elements,id){
        mTargetMetrics.set(id,elements.length);
    });
   
    return ({"sourceMetrics": mSourceMetrics,"targetMetrics":mTargetMetrics});
}

function buildExample() {
    var m1 = new Model('source');
    var m2 = new Model('target');
    
    var MM = Class.newInstance('MM');
    MM.setAttribute('name',String);
    MM.setAttribute('permission',Boolean);
    
    var MMbis = Class.newInstance('MMbis');
    MMbis.setAttribute('name',String);
    MMbis.setAttribute('inv',Number);
    
    MM.setReference('refMb', MMbis, -1);
    
    //Model 1
    var ms = MM.newInstance();
    ms.name='sourceEl'
    ms.permission=false;
    
    
    var mrav = MM.newInstance();
    mrav.name='sourceRAV';
    mrav.permission=false;
    
    var bis = MMbis.newInstance();
    bis.name='bis';
    bis.inv=12;
    
    ms.refMb=bis;
    
    // Model   2 compared
    var mt1 = MM.newInstance();
    mt1.name='targetEL'
    mt1.permission=false;
    
    var mt2= MM.newInstance();
    mt2.name='sourceEl';
    mt2.permission=false;
    
    var mt3=MM.newInstance();
    mt3.name='sourceEl';
    mt3.permission=true;
    
    var b1 = MMbis.newInstance();
    b1.name='bis';
    b1.inv=12;
    
    m1.setModellingElements([ms,mrav,bis]);
    m2.setModellingElements([mt1,mt2,mt3,b1]);
    
    return {sm: m1, tm:m2};
    
}

/**

@pre-condition: the two elements have common metamodel
@return an object containing the difference (can/should be a JSMF model!)
*/
function modelElementDifference(source,target,depth) {

    var attributeKeys = Object.keys(source.conformsTo().getAllAttributes());
    var targetKeys = Object.keys(source.conformsTo().getAllAttributes());
    
    //do the same for references
    var referenceSourceKeys = Object.keys(source.conformsTo().getAllReferences());
    var referenceTargetKeys = Object.keys(source.conformsTo().getAllReferences());
    
    var diffObject = [];
    
  // console.log( _.difference(attributeKeys,targetKeys));
    
    _.each(attributeKeys,function(attName){
        //console.log(attName, " : ",source[attName], "vs", target[attName]);
        if(!(_.isEqual(source[attName],target[attName]))){
            diffObject.push({name:attName,targetValue:target[attName],sourceValue:source[attName]});
        }
        
    });
    
    _.each(referenceSourceKeys, function(refName) {
      if(source[refName].length!=0) {
        console.log(refName,' : ' ,source[refName], 'vs',target[refName]);
      }
    });
    
    return diffObject;
}


var comparator = buildExample();
compare(comparator.sm, comparator.tm);


module.exports = {
    compare: compare
} 