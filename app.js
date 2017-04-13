'use strict'
const flash = require('connect-flash');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const jsmfjson = require('jsmf-json');
const fs = require('fs');
const multer  = require('multer')

const express = require('./bootstrap.js').express;
const app = require('./bootstrap.js').app;
const http = require('./bootstrap.js').http;
const io = require('./bootstrap.js').io;
const log_web_socket = require('./bootstrap.js').log_web_socket;
const buildModel = require('./helper.js').buildModel;

const conf = require('./conf.js');
var IC3Proto = require('./conf.js').IC3Proto,
    IC3ProtoGrammar = require('./conf.js').IC3ProtoGrammar,
    IC3EntryPoint = require('./conf.js').IC3EntryPoint,
    BinaryAppProtoBuf = require('./conf.js').BinaryAppProtoBuf

const apk_analyzer = require('./process');

var protoBufModels =  require('builder');
// load the default model
protoBufModels.build(IC3Proto, IC3ProtoGrammar, IC3EntryPoint,
    BinaryAppProtoBuf);

const listening_port = process.env.PORT || 3000;


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
var upload = multer({ dest: 'uploads/' });//.array('files', 2);


http.listen(listening_port, function () {
    console.log('Listening on port ' + listening_port);
});


app.get('/', function (req, res) {
    var errorMessage = JSON.stringify('');
    res.render('index.html', {errorMessage: errorMessage });
});


app.get('/sun', function (req, res) {
    var M = protoBufModels.model;
    var serializedModel = jsmfjson.stringify(M);

    var source_code =  {};
    M.modellingElements['Component']
    //.concat(M.modellingElements['Instruction'])
    .map(function(component) {
        var name;
        name = component.name || component.class_name;
        if (name) {
            var file = conf.bin_outputs + 'result-jdcmd/' +
            name.replace(/\./g, '/')  + '.java';
            var content;
            try {
                content = fs.readFileSync(file, 'utf-8')
            } catch (err) {
                //console.log(err);
                console.log("Error when reading: " + err);
            }
            source_code[name] = escape(content);
        }
    });
    source_code = JSON.stringify(source_code);

    fs.readFile(conf.bin_outputs + 'apk_ast.json', 'utf-8', (err, data) => {
        if (err) {
            console.log(err);
            data = {};
        }
        res.render('sunburst.html',{
            serializedModel: serializedModel,
            sourceCode: source_code,
            sourceCodeAST: data
        });
    });


});


app.get('/s', function(req, res) {
    var M = protoBufModels.model;
    var serializedModel = jsmfjson.stringify(M);
    res.render('graph.html',{serializedModel: serializedModel });
});


app.get('/models', function(req, res){
    res.render('modelsbehind.html' );
});


app.post('/upload',  upload.array('files[]', 2), function(req, res, next) {
    // We can receive 1 or 2 APK through the POST request. When 2 APK are
    // submitted the user is redirected to twe comparison page.
    var M = protoBufModels.model;

    console.log(req.files.length);

    req.files.map(function(file) {

        // A binary protobuf is directly submitted -
        // simply relaunch the protobufModel construction.
        if (file && file.originalname.split('.').pop() == "dat") {
            console.log(`A binary protobuf file has been received: ${file.originalname}`)
            protoBufModels.build(IC3Proto, IC3ProtoGrammar, IC3EntryPoint,
                file.path);
        }

        // An APK is submitted - launch the full process.
        else if (file && file.originalname.split('.').pop() == "apk") {
            log_web_socket(io,
                `An APK file has been received: ${file.originalname}`)
                console.log('LAUNCHING A NEW ANALYSIS...');
                    apk_analyzer.start_process(file);
        }

        else {
            req.flash('error', `File ignored: ${file.originalname}. ` +
            'You must submit a *.apk or *.dat file.');
        }
    })
    res.status(200).send('process launched in background');
});


app.get('/compare', function(req, res){
    res.render('compare.html');
});
