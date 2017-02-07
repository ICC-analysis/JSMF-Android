'use strict'
var flash = require('connect-flash');
var session = require('express-session');
var cookieParser = require('cookie-parser')
var messages = require('express-messages');
var jsmf = require('jsmf-core'),
Class = jsmf.Class, Model = jsmf.Model;
var jsmfjson = require('jsmf-json');
var fs = require('fs');
var multer  = require('multer')
var japa = require("java-parser");
var serialize = require('node-serialize');

var express = require('./bootstrap.js').express;
var app = require('./bootstrap.js').app;
var http = require('./bootstrap.js').http;
var io = require('./bootstrap.js').io;
var log_web_socket = require('./bootstrap.js').log_web_socket;

var protoBufModels =  require('builder');

var IC3Proto = require('./conf.js').IC3Proto,
  IC3ProtoGrammar = require('./conf.js').IC3ProtoGrammar,
  IC3EntryPoint = require('./conf.js').IC3EntryPoint,
  BinaryAppProtoBuf = require('./conf.js').BinaryAppProtoBuf

protoBufModels.build(IC3Proto, IC3ProtoGrammar,
                      IC3EntryPoint, BinaryAppProtoBuf);

var listening_port = process.env.PORT || 3000;


var process_async = require('./process');

app.use(session({
  secret: 'sessio0-Id',
  saveUninitialized: true,
  resave: true
}));
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

//app.set('views', __dirname + '/views'); //default
app.set('view engine', 'ejs');
app.engine('.html', require('ejs').renderFile);

//configure the static content (bower components) and links to views.
//app.use(express.static(__dirname + '/views'));
app.use('/images',  express.static(__dirname + '/static/images'));
app.use('/bower_components',  express.static(__dirname + '/bower_components'));

//configuration of the read file method
var upload = multer({ dest: 'uploads/' });



http.listen(listening_port, function () {
  console.log('Listening on port ' + listening_port);
});

app.get('/', function (req, res) {
  var errorMessage = JSON.stringify('');

  res.render('index.html', {errorMessage: errorMessage });
});

app.get('/sun', function (req, res) {
    var bin_outputs = 'outputs/';

    var M = protoBufModels.model;
	//console.log(M.referenceModel);
    var serializedModel = jsmfjson.stringify(M);
    //console.log(serializedModel);
    //console.log(M.modellingElements['Component'].length);

    var source_code =  {};
    M.modellingElements['Component'].map(function(component) {
        var file = bin_outputs + 'result-jdcmd/' +
                    component.name.replace(/\./g, '/') + '.java';
        var content;
        try {
              content = fs.readFileSync(file, 'utf-8')
        } catch (err) {
              //console.log(err);
              console.log("Error when reading: " + file);
        }
        source_code[component.name] = escape(content);
    });

    source_code = JSON.stringify(source_code);

    res.render('sunburst.html',{
                                serializedModel: serializedModel,
                                sourceCode: source_code
                            });
});

app.get('/s', function(req,res) {
	var M = protoBufModels.model;
	var serializedModel = jsmfjson.stringify(M);
	res.render('graph.html',{serializedModel: serializedModel });
});

app.get('/models', function(req,res){
   res.render('modelsbehind.html' );
});

app.post('/upload', upload.single('file'), function(req, res, next) {

    var M = protoBufModels.model;

    var msg = '';
    var bin_outputs = 'outputs/';

    // clean the folder where outputs of subprocess are stored
    const spawn_sync = require('child_process').spawnSync;
    const spawn = require('child_process').spawn;
    const rm = spawn_sync('rm', ['-Rf', bin_outputs]);


    if (req.file && req.file.originalname.split('.').pop() == "dat") {
        // A binary protobuf is directly submitted
        //relaunch the protobufModel construction
        console.log('A binary protobuf file has been received: ' +
        req.file.originalname)
        protoBufModels.build(IC3Proto, IC3ProtoGrammar,
            IC3EntryPoint, req.file.path);
    }

    else if (req.file && req.file.originalname.split('.').pop() == "apk") {
        // An APK is submitted
        //log_web.logWebSocket(io, 'An APK file has been received: ' + req.file.originalname)
        log_web_socket(io, 'An APK file has been received: ' + req.file.originalname)

        process_async.start_process(req);

    }

    else {
        req.flash("error", "You must submit a *.apk or *.dat file.");
    }

    res.redirect("/");
});





//Helper model to test functionalities - should be improved with larger model
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
