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
const _ = require('lodash');

const conf = require('./conf.js');
var IC3Proto = require('./conf.js').IC3Proto,
    IC3ProtoGrammar = require('./conf.js').IC3ProtoGrammar,
    IC3EntryPoint = require('./conf.js').IC3EntryPoint,
    BinaryAppProtoBuf = require('./conf.js').BinaryAppProtoBuf

const apk_analyzer = require('./process');

const comparator = require('./comparator.js');

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
app.use('/js',  express.static(__dirname + '/static/js'));
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
            var file = conf.bin_outputs + 'jdcmd/' +
            name.replace(/\./g, '/')  + '.java';
            var content;
            try {
                content = fs.readFileSync(file, 'utf-8')
            } catch (err) {
                console.log("Error when reading: " + err);
            }
            source_code[name] = escape(content);
        }
    });
    source_code = JSON.stringify(source_code);

    fs.readFile(conf.bin_outputs + 'apk_ast.json', 'utf-8', (err, data) => {
        if (err) {
            console.log(`APK not found: ${err}`);
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
    // We can receive 1 or 2 APK through the POST request.
    const spawn_sync = require('child_process').spawnSync;
    spawn_sync('rm', ['-Rf', conf.bin_outputs]);
    apk_analyzer.ICC_models = [];

    var generate_ast = true;
    if (req.body.generate_ast == 'false') {
        generate_ast = false;
    }

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
            apk_analyzer.start_process(file, generate_ast);
        }

        else {
            req.flash('error', `File ignored: ${file.originalname}. ` +
            'You must submit a *.apk or *.dat file.');
        }
    })
    return res.status(200).send('process launched in background');
});


app.get('/compare', function(req, res) {

    var model1 = false;
    var model2 = false;

    // try {
    //     var model1 = jsmfjson.stringify(apk_analyzer.ICC_models[0]);
    // }
    // catch (err) {
    //     console.log(`ICC model not found: ${err}`);
    //     req.flash('error', `ICC model not found.`);
    // }
    // try {
    //     var model2 = jsmfjson.stringify(apk_analyzer.ICC_models[1]);
    // }
    // catch (err) {
    //     console.log(`ICC model not found: ${err}`);
    //     req.flash('error', `ICC model not found.`);
    // }




    fs.readFile(conf.bin_outputs + 'FFE44A8695CCEB4979825C54A29B4CB9765057308A97E49F6C6C5C473DED0AB3.apk.json', 'utf-8', (err, data) => {
        if (err) {
            console.log(`ICC model not found: ${err}`);
            req.flash('error', `ICC model not found: ${err}`);
        }
        else {
            model1 = jsmfjson.parse(data);
            model1 = jsmfjson.stringify(model1);
        }

        fs.readFile(conf.bin_outputs + '1CA20CC2CCF0E981781B25BAD314098A168B6FAF848393A37D19A302A40F3F4C.apk.json', 'utf-8', (err, data) => {
            if (err) {
                console.log(`ICC model not found: ${err}`);
                req.flash('error', `ICC model not found: ${err}`);
            }
            else {
                model2 = jsmfjson.parse(data);
                model2 = jsmfjson.stringify(model2);
            }
            
            // Done during the hackathon: try to get directly the tab from compartor not the map.
            if(model1!==undefined && model2 !==undefined) {
                var metrics = comparator.compare(jsmfjson.parse(model1),jsmfjson.parse(model2));
                var sourceMetricsTab = [];
                var targetMetricsTab = [];
                var diffMetrics = [];
                for (var [key, value] of metrics.sourceMetrics) {
                   sourceMetricsTab.push({"key":key,"val":value});
                }
                 for (var [key, value] of metrics.targetMetrics) {
                   targetMetricsTab.push({"key":key,"val":value});
                }
                //List are ordered the same way...
                for(var i in sourceMetricsTab) {
                    var diffVal = (targetMetricsTab[i].val-sourceMetricsTab[i].val);    
                    diffMetrics.push({"key":sourceMetricsTab[i].key,"val":diffVal});
                }
              
                var metricsToSend={sourceMetrics: sourceMetricsTab,targetMetrics:targetMetricsTab,diffMetrics:diffMetrics};
                metrics = JSON.stringify(metricsToSend);
            }
            
            res.render('compare.html',{
                model1: model1,
                model2: model2,
                metrics: metrics
            });
        });
    });


    // res.render('compare.html',{
    //     model1: model1,
    //     model2: model2
    // });
});
