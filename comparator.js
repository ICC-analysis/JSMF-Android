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
        //assuming they have the same classes;
        mSourceMetrics.set(id,elements.length);
        _.each(elements,function(elem){
         //  var currentlnormal = normalizeModelElements(elem);
            _.each(mTargetElements[id], function(target) {
                
                //Assumption: Objects have the same metamodel... should be tested before
                var diff = modelElementDifference(elem,target,1);
                var diffAtt = _.filter(diff,{type:"attribute"});
                var diffRef = _.filter(diff,{type:"reference"});
                
                const diflen= diff.length;
               
                if(diflen!==0) {
                    //console.log('diff ',elem.name, ' : ', target.name, '/ ', diff);
                    //compute too "much" difference (heuristic) -> see with bayesian approach
                    const attributeKeys = Object.keys(elem.conformsTo().getAllAttributes());
                    const referenceKeys = Object.keys(elem.conformsTo().getAllReferences());
                  
                        //WARNING: Heuristic, if some attributes are common =>threshold 50%?
                        if(diffAtt.length<=(attributeKeys.length/2) && diffRef.length<=(referenceKeys.length/2)) {
                            //console.log('Similar');
                            sameSimilar.push({type:'diff',src:elem,tgt:target,meta:id,diff:diff});
                        } else {
                            //if more than 50% of attributes are different => different modelling elements
                            //console.log('too much difference: probably not the same elements');
                        }
                    
                } else { //no differences between objects
                    //console.log('Same Objects');
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
    
    var tierce = MMbis.newInstance();
    tierce.name='tierce';
    tierce.inv=123;
    
    ms.refMb=[bis,tierce];
    
    // Model   2 compared
    var mt1 = MM.newInstance();
    mt1.name='targetEL'
    mt1.permission=false;
    
    var mt2= MM.newInstance();
    mt2.name='sourceEl';
    mt2.permission=false; //  // console.log( _.difference(attributeKeys,targetKeys))console.log( _.difference(attributeKeys,targetKeys))
    
    var mt3=MM.newInstance();
    mt3.name='sourceEl';
    mt3.permission=true;
    
    var b1 = MMbis.newInstance();
    b1.name='bis';
    b1.inv=12;
    
    mt2.refMb=b1;
    
    m1.setModellingElements([ms,bis,tierce]);
    m2.setModellingElements([mt1,mt2,b1]);
    
    return {sm: m1, tm:m2};
    
}

/**
* Pairwise comparison of two model elements conforms to the same metamodel element.
@ param source : source model element to be compared to
@ param target : target model element to be compared.
@ param depth : relation traversal depth (to avoid circular to avoid complexe deep comparison);
@pre-condition: the two elements have common metamodel
@return an object containing the difference (can/should be a JSMF model!). Undefined  if any of source or target are undefined
*/
function modelElementDifference(source,target,depth) {
    
    //init the depth to one = checking references
    var depth = depth==undefined? 1 : depth;
    
    if(target!==undefined && source!==undefined) {
        var diffObject = [];
        //precond : source / target !== undefined
        var attributeKeys = Object.keys(source.conformsTo().getAllAttributes());
        //var targetKeys = Object.keys(source.conformsTo().getAllAttributes());

        //do the same for references
        var referenceKeys = Object.keys(source.conformsTo().getAllReferences());
        //var referenceTargetKeys = Object.keys(source.conformsTo().getAllReferences());

        _.each(attributeKeys,function(attName){
            //console.log(attName, " : ",source[attName], "vs", target[attName]);
            if(!(_.isEqual(source[attName],target[attName]))){
                diffObject.push({name:attName,
                                 targetValue:target[attName],
                                 sourceValue:source[attName],
                                 type:"attribute"
                                });
            }

        });
        //do not go to deep in the object comparisons
        if(depth > 0) {
            _.each(referenceKeys, function(refName) {
                const refSource = source[refName];
                const refTarget = target[refName];
              if(refSource.length!=0) {

                //TODO: check the targetted types
                  //Compare elements one by one
                  var Msource = new Model();
                  var Mtarget = new Model();
                  
                  Msource.add(refSource);
                  Mtarget.add(refTarget);
                  
                  var oID= orderIndependentDiff(Msource,Mtarget,depth-1);
                  
                  //See if relevant to have same card or not?
                    if(!(refSource.length==refTarget.length)) {
                       // console.log('Different effective cardinalities', refTarget.length);
                        
                       // console.log('oid',oID);
                        var diffref = _.reject(oID,{type:'same'});
                        diffObject.push({name:refName,src:source,tgt:target, diff:diffref, type:"reference"})
                        //remplace the smaller one by place holder/undefined -> use the orderIndependentDiff
                        //
                    } else {
                    //check the elements targetted  
                    //console.log('Same cardinality');
                    //console.log("oid2 ",oID);    
                    var diffref = _.reject(oID,{type:'same'});
                        if(diffref.length!=0){
                            diffObject.push({name:refName,src:source,tgt:target, diff:diffref, type:"reference"}) 
                        }
                    }   
              } //endif : if source[refName] is defined
            });
        } //endif check reference (depth !==  0)
    }
    return diffObject;
}

//Check Similarity/difference of two models conforms to the same metamodel
function  orderIndependentDiff(ModelSource,ModelTarget,depth) {
    
    const mSourceElements = ModelSource.modellingElements;
    const mTargetElements = ModelTarget.modellingElements;
    
    var sameSimilar = [];
    //comparison class by class
    _.each(mSourceElements,function(elements,id){
        //assuming they have the same classes
       // console.log(id);
        _.each(elements,function(elem){
         //  var currentlnormal = normalizeModelElements(elem);
            _.each(mTargetElements[id], function(target) {
                
                //Assumption: Objects have the same metamodel... should be tested before
                //TODO Check the search depth..
                var diff = modelElementDifference(elem,target,depth);
                var diffAtt = _.filter(diff,{type:"attribute"});
               // console.log('diff: ',diffAtt);
                const diflen= diff.length;
               
                if(diflen!==0) {
                    //console.log('diff ',elem.name, ' : ', target.name, '/ ', diff);
                    //compute too "much" difference (heuristic) -> see with bayesian approach
                    var attributeKeys = Object.keys(elem.conformsTo().getAllAttributes());
                  
                        // if some attributes are common =>threshold 50%?
                        if(diffAtt.length<=(attributeKeys.length/2)) {
                       // console.log('OI-Similar');
                        sameSimilar.push({type:'diff',src:elem,tgt:target,meta:id,diff:diff});
                        } else {
                            //if all attributes are different => different modelling elements
                         //   console.log('OI-DiSimilar');
                            sameSimilar.push({type:'largediff', src:elem, tgt:target,meta:id,diff:diff})
                            //console.log('too much difference: probably not the same elements');
                        }
                    
                } else {
                   // console.log('OI-same Objects');
                    sameSimilar.push({type:'same',src: elem, tgt: target, meta:id,diff:[]});
                    //Similar checked : add tuple source/target to list as similar
                }
            });
           
        });
     }); 
    return sameSimilar;
}


//var comparator = buildExample();
//compare(comparator.sm, comparator.tm);


module.exports = {
    compare: compare
} 
