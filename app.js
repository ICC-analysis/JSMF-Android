'use strict'
var flash = require('connect-flash');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var jsmfjson = require('jsmf-json');
var fs = require('fs');
var multer  = require('multer')

var express = require('./bootstrap.js').express;
var app = require('./bootstrap.js').app;
var http = require('./bootstrap.js').http;
var io = require('./bootstrap.js').io;
var log_web_socket = require('./bootstrap.js').log_web_socket;
var buildModel = require('./helper.js').buildModel;

var conf = require('./conf.js');
var IC3Proto = require('./conf.js').IC3Proto,
  IC3ProtoGrammar = require('./conf.js').IC3ProtoGrammar,
  IC3EntryPoint = require('./conf.js').IC3EntryPoint,
  BinaryAppProtoBuf = require('./conf.js').BinaryAppProtoBuf

var protoBufModels =  require('builder');
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
    var M = protoBufModels.model;
	//console.log(M.referenceModel);
    var serializedModel = jsmfjson.stringify(M);
    //console.log(serializedModel);
    //console.log(M.modellingElements['Component'].length);

    var source_code =  {};
    M.modellingElements['Component'].map(function(component) {
        var file = conf.bin_outputs + 'result-jdcmd/' +
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
