/**
*   Example app that build a JSMF model from a protobuf message (using protobufjs)
*   @licence MIT
*   @Author Jean-Sébastien Sottet
*/

const ProtoBuf = require("protobufjs"),
    fs = require("fs"),
    JSMF = require('jsmf-core'),
    Model = JSMF.Model,
    JSMFProtoBuf = require('./jsmfBuilder.js'),
    _ = require('lodash');

function build(IC3Proto, IC3ProtoGrammar, IC3EntryPoint, BinaryAppProtoBuf) {
  JSMFProtoBuf.parse(IC3ProtoGrammar, IC3Proto)
  MMProto = JSMFProtoBuf.metamodel

  var builder = ProtoBuf.loadProtoFile(IC3Proto);
  var message = builder.build(IC3EntryPoint); //"edu.psu.cse.siis.ic3"

  //Select file
  var buffer = fs.readFileSync(BinaryAppProtoBuf);

  var mymsg = message.decode(buffer);


  //Create a new model "Mapp" and entry point JSMF instance "application"
  var MApp=populateModel('Application',new Model('App'),mymsg);


  exports.metamodel = MMProto;
  exports.model = MApp;

  //console.log(MApp);
}



/*
console.log(MApp.modellingElements.Application[0].components[0].exit_points[0].instruction[0].statement);

_.map(MApp.modellingElements.Application[0].components[0].exit_points, x => {
           (x.intents!=undefined && console.log(x.intents[0].attributes[0].value))
    }
);
*/

//Display the multivalued attribte of application and Long (object) for analysis_start
//console.log(MApp.modellingElements.Application[0].used_permissions, MApp.modellingElements.Application[0].analysis_start)


/**Return the model builds from an entry point Class name ('e.g., Application')
*   @param EPClassName {String} identifier/name of the metamodel element entry point
*   @param Model {JSMF-Model} the model to be populated
*   @param sourceObj {Object} the object obtained by message parsing
*/
function populateModel(EPClassName, Model, sourceObj) {

    var result = Model==undefined ? new Model('App') : Model

    //init a class
    var MMApplication = getMMClass(MMProto,EPClassName)

    //set model to Flexible to address the Long object case (type defined in external library Long.js).
    // => that works with JSMF using a dynamic typing : setFlexible = true.
    //MMApplication.setFlexible(true);
    var application = MMApplication.newInstance();
    result.add(application);

    setAttributeFromM2(EPClassName,application,sourceObj);

    buildModel(EPClassName,application,sourceObj,result)
    return result;
}

/**
* @param MMType {String} identifier/name of the metamodel element
* @param MElem {JSMF Instance} a modelling element to be populated
* @param sourceObj {Object} a javascript raw/original object provided by the parsed source/tool
*/
function setAttributeFromM2 (MMtype, MElem, sourceObj) {
    var compo = getMMClass(MMProto,MMtype);

    _.forEach(compo.attributes, (x,y) =>
        {
            var currentElem = sourceObj==null ? null: sourceObj[y];

            if(currentElem!== null){
                if(currentElem!==undefined && (currentElem.length==undefined || currentElem.length>0)) {
                    if(_.isArray(currentElem)) { //it is a multivalued attribute
                        MElem[y]=sourceObj[y] //get here thw whole array of attributes
                    } else {
                        MElem[y]=sourceObj[y]
                    }
                }
            }
        });
}

/**
* @param MMtype {String} identifier/name of the metamodel element
* @param MElem {JSMF Instance} a modelling element to be populated
* @param sourceObj {Object} a javascript raw/original object provided by the parsed source/tool
* @param MApp {JSMF Model} the model to be populated
*/
//Warning should avoid cyclic relations
function buildModel(MMtype,MElem,sourceObj,MApp) {
    var compo = getMMClass(MMProto,MMtype);

     // Getting through the metamodel all the references
      _.forEach(compo.references, (x,refName) => {
            var currentType= x.type
            //set the current relation Name (to be invoked after the creation of element).
            var stringAddRel = 'add'+toTitleCase(refName)

            var targetObj = sourceObj[refName];
            if(!_.isArray(targetObj)) { targetObj=[targetObj] }

            _.forEach(targetObj, curr => {
//                 if(currentType.__name=="Instruction"){console.log('t',sourceObj[refName],curr)};
                var cModelElement = currentType.newInstance();
                MApp.add(cModelElement);
                MElem[stringAddRel](cModelElement);
                setAttributeFromM2(currentType.__name,cModelElement,curr)
                //recCall
                buildModel(currentType.__name,cModelElement,curr,MApp)
          })
    });
   return MApp
}

//Util function to make First letter uppercaseonly
function toTitleCase(str)
{
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

//Util function that will be part of JSMF assuming there is only one Class of that name
function getMMClass(metamodel, name) {
   return  metamodel.classes[name][0];//_.filter(metamodel.modellingElements.Class, function(x) {return x.__name == name})[0]
}

exports.build = build;
