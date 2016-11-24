/*
*  Google ProtoBuff Grammar to JSMF Metamodel
* 
*   @licence MIT
*   @Author Jean-Sébastien Sottet
*/
/*
* Todo : Scope of the definition of elements
* Todo : it is currently dependend on the order of the declared element in the proto file...should be order dependent 
* (i.e., reference creation)
*/

{
    var opt = options.jsmf;
    var MMProto = new opt.Model('Protobuf');
    
    //make the correspondance between goggle type and JSMF types
    function jsmfType(typeProto) {
        var result = undefined;
        switch(typeProto) {
            case('string'):
                    result = {attrType: true, type:opt.String};
                break;
            case('int32'):
                    result= {attrType: true, type:Number};
                break;
            case('uint32'):
                    result= {attrType: true, type:Number};
                break;
            case('bool'):
                    result= {attrType: true, type:Boolean};
                break;
            case('int64'):
                    result= {attrType: true, type:Object}; //originally a long type used by protobuf.js => long.js
                break;
            default:
                    result = undefined;    
        }
        if(result==undefined) {         
        //Warning : Look at the name in the MM proto not on the scope of definition inside the protobuf file...
           for(let i = 0; i<MMProto.modellingElements.Enum.length;i++) {
                if(MMProto.modellingElements.Enum[i].__name==typeProto) {
                    result = {attrType:true,type:MMProto.modellingElements.Enum[i]}
                }
           }
            
           for(let i = 0; i<MMProto.modellingElements.Class.length;i++) {
                if(MMProto.modellingElements.Class[i].__name==typeProto) {
                    result = {attrType:false,type:MMProto.modellingElements.Class[i]}
                }
           }     
        }
        return result;
    }
}

Start = "syntax" ws "=" ws "\"" ws v:VersionNum ws "\""  ws ';'
        ws Package? ((Enum / Message) ws)* 
{  
    var result = opt.Class.newInstance('Syntax');
    result.addAttribute('version',String);
    MMProto.add(result);
    return MMProto;
} 

Package = 'package' ws pname:Identifier ws ';' ws
{
    var result = opt.Class.newInstance('Package '+ pname)
    MMProto.add(result);
    return MMProto;
}


Message = 'message' ws id:String ws '{' ws
         attTable:Content*  '}' ws
{
    var result = opt.Class.newInstance(id)
    
    //if attTable was not an Enum nor a Message( a.k.a. Class) (i.e., it matched Optional or Repeated rule)
    for(let j =0; j < attTable.length;j++) {
        
        if(attTable[j]!==undefined && attTable[j].feature===true) {
            
          // console.log(attTable[j].feature, jsmfType(attTable[j].type));
            var att = attTable[j]
            var refType = jsmfType(att.type);
            //WARNING if refType === undefined => case of not previously matched reference messages or not declared primitive type
            if(refType!=undefined && refType.attrType){    
                att.mand? refType.type=Array : refType.type;
                result.addAttribute(att.name,refType.type,att.mand)
            } 
             if(refType!=undefined && !refType.attrType){ //else it is a reference 
                // console.log(id, attTable[j].name);
                var card = -1;
                att.mand? card =-1 : card=1; 
                result.addReference(att.name,refType.type,card);
            }
        }
    }
    MMProto.add(result);
    //return MMProto;
}

Content = Message / Enum / Optional / Repeated 

Optional = 'optional' ws type:Identifier ws name:String ws '=' ws code:Identifier ws ';' ws
{
    const op = {feature:true,type:type,name:name,code:code,mand:false};
    return op;
}
            
Repeated = 'repeated' ws type:Identifier ws name:String ws '=' ws code:Identifier ws ';' ws
{
    const rep = {feature:true,type:type,name:name,code:code,mand:true};
    return rep;
}

Enum = 'enum' ws id:Identifier ws '{' ws lit:Litteral* ws '}' ws
{
   var e = new opt.Enum(id,lit);
   MMProto.add(e);
   //return MMProto;
}


Litteral = id:String ws '=' ws val:Identifier ws ';' ws
{
    return id;
}
  
//Lexer
VersionNum = id:Identifier 

Identifier = $([A-Za-z0-9\._\$]+)
    
String = $([a-zA-Z_\$]+)

ws "whitespace"
    = [ \t\n\r]* / eol*

eol
  = "\n"        //line feed
  / "\r\n"      //carriage + line feed
  / "\r"        //carriage return
  / "\u2028"    //line separator
  / "\u2029"    //paragraph separator