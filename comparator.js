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
    
    var sourcekeys = [];
    var targetkeys = [];
    var keys = [];
    
    var sameSimilar = [];
    
    //comparison class by class
    _.each(mSourceElements,function(elements,id){
        //assuming they have the same classes
        sourcekeys.push(id);
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
                            console.log('too much difference');
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
        targetkeys.push(id);
        mTargetMetrics.set(id,elements.length);
    });
   
    return ({"sourceMetrics": mSourceMetrics,"targetMetrics":mTargetMetrics});
}

/*
function normalizeModelElements(modelElement) {
    
    var attributeKeys = Object.keys(modelElement.conformsTo().getAllAttributes());
    
    var referenceKeys = Object.keys(modelElement.conformsTo().getAllReferences());
    
    var result = new Map();
    var attributes = [];
    var references=[];
    
    _.each(attributeKeys,function(attName){
           // console.log(attName, " : ",modelElement[attName]);
         attributes.push(modelElement[attName]); 
    });
    
    _.each(referenceKeys, function(refName) {
          references.push(modelElement[refName]); // filter the target
    });
     
    //model element is map key -> facilitate the retrieval using references
    result.set(modelElement,{att: attributes,ref:references});
    return result;
}
*/

function buildExample() {
    var m1 = new Model('source');
    var m2 = new Model('target');
    
    var MM = Class.newInstance('MM');
    MM.setAttribute('name',String);
    MM.setAttribute('permission',Boolean);
    
    var ms = MM.newInstance();
    ms.name='sourceEl'
    ms.permission=false;
    
    var mrav = MM.newInstance();
    mrav.name='sourceRAV';
    mrav.permission=false;
      
    var mt1 = MM.newInstance();
    mt1.name='targetEL'
    mt1.permission=false;
    
    var mt2= MM.newInstance();
    mt2.name='sourceEl';
    mt2.permission=false;
    
    var mt3=MM.newInstance();
    mt3.name='sourceEl';
    mt3.permission=true;
    
    m1.setModellingElements([ms,mrav]);
    m2.setModellingElements([mt1,mt2,mt3]);
    
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
       // console.log(attName, " : ",source[attName], "vs", target[attName]);
        if(!(_.isEqual(source[attName],target[attName]))){
            diffObject.push({name:attName,targetValue:target[attName],sourceValue:source[attName]});
        }
        
    });
    
    _.each(referenceSourceKeys, function(refName) {
       console.log(source[refName]);
    });
    
    return diffObject;
}


var comparator = buildExample();
compare(comparator.sm, comparator.tm);


module.exports = {
    compare: compare
} 