'use strict'
var express = require('express');
var jsmf = require('jsmf-core'),
Class = jsmf.Class, Model = jsmf.Model;
var jsmfjson = require('jsmf-json');
var fs = require('fs');

//
var protoBufModels =  require('builder');

var app = express();
//app.set('views', __dirname + '/views'); //default
app.set('view engine', 'ejs');
app.engine('.html', require('ejs').renderFile);

//configure the static content (bower components).
app.use(express.static(__dirname + '/views'));
app.use('/bower_components',  express.static(__dirname + '/bower_components'));


app.get('/static', function (req, res) {
 res.render('index.html');
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});


app.get('/s', function(req,res) {
	//var M = buildModel();
	var M = protoBufModels.model;
	//console.log(M.referenceModel);
	var serializedModel = jsmfjson.stringify(M);
	
	fs.writeFile("./serial.txt", serializedModel, function(err) {
        if(err) { console.log('err'); throw(err) }
        else { console.log('Saved') }
    });

	res.render('index2.html',{serializedModel: serializedModel });
});

function  buildModel() {
	
 var MM = new Model('MetaVisu');

    var ClassA = Class.newInstance("A");
    ClassA.addAttribute('wheels', Number);
    ClassA.setReference('next',ClassA,1)

    var ClassB = Class.newInstance("B");
    ClassB.setAttribute('name',String)
    ClassB.addAttribute('quality', String);
    ClassB.setReference('wheelQuality',ClassA,-1);

    ClassA.setReference('xf',ClassB,1);

    var ClassC = Class.newInstance("C");
    ClassC.addAttribute('name', String);

    ClassA.setReference('reminder',ClassC,-1);    

    MM.add([ClassA,ClassB,ClassC])

    var smallA = ClassA.newInstance();
    smallA.wheels = 4;


    var bigA = ClassA.newInstance();
    bigA.wheels = 6;
    bigA.next=smallA

    var smallB = ClassB.newInstance();
    smallB.name='TUV'
    smallB.quality = 'good';
    smallB.wheelQuality=[smallA,bigA];

    var xA  = ClassA.newInstance({wheels:2}); 

    var xxA = ClassA.newInstance({wheels:1});

    smallA.next=xA;
    xA.next=xxA;


    var smallx = ClassB.newInstance({name:'NordVerif', quality:'medium'});  
    smallx.wheelQuality=[xA,xxA];  

    var cein = ClassC.newInstance({name:'Change'});
    smallA.reminder=cein;
    xxA.reminder=cein;

    var M = new Model('Testvisu')

    M.setReferenceModel(MM);

    M.add([smallA,smallB,bigA,cein,xA,xxA,smallx]);

    return M;
    

}
