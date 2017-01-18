'use strict'
var express = require('express');
var flash = require('connect-flash');
var session = require('express-session');
var cookieParser = require('cookie-parser')
var messages = require('express-messages');
var jsmf = require('jsmf-core'),
Class = jsmf.Class, Model = jsmf.Model;
var jsmfjson = require('jsmf-json');
var fs = require('fs');
var multer  = require('multer')

var protoBufModels =  require('builder');

var IC3Proto = './var/ic3/ic3data.proto',
  IC3ProtoGrammar = './var/ic3/grammar.pegjs',
  IC3EntryPoint = 'edu.psu.cse.siis.ic3.Application',
  BinaryAppProtoBuf ='./var/apps/krep.itmtd.ywtjexf_3.dat'  //'./var/apps/a2dp.Vol_107.dat'

protoBufModels.build(IC3Proto, IC3ProtoGrammar,
                      IC3EntryPoint, BinaryAppProtoBuf);

var listening_port = process.env.PORT || 3000;

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);



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

 res.render('sunburst.html',{serializedModel: serializedModel });
});

app.get('/s', function(req,res) {
	var M = protoBufModels.model;
	var serializedModel = jsmfjson.stringify(M);
  /*
  	fs.writeFile("./serial.txt", serializedModel, function(err) {
          if(err) { console.log('err'); throw(err) }
          else { console.log('Saved') }
      });
  */
	res.render('graph.html',{serializedModel: serializedModel });
});

app.get('/models', function(req,res){
   res.render('modelsbehind.html' );
});

app.post('/upload', upload.single('file'), function(req, res, next) {
    var msg= '';
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
        logWebSocket('An APK file has been received: ' + req.file.originalname)

        // Generation of the model of application's
        // "Inter-Component Communication" representation.
        //
        msg = 'Launching a child process (CP-1) in order to retarget and ' +
        'generate a binary proto file.'
        logWebSocket(msg);

        logWebSocket("[CP-1] analysis of the Inter-Component Communication with IC3...");
        const cmd = spawn('bin/APK-analyzer/apk2icc.sh', [req.file.path, req.file.originalname]);

        cmd.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
        });

        cmd.stdout.on('data', (data) => {
            //console.log(`stdout: ${data}`);
            //io.emit('news', data);
        });

        cmd.on('close', (code) => {
            if (code ==0)
            {
                BinaryAppProtoBuf = bin_outputs + 'ic3/' +
                                    req.file.filename + '/result.dat';
                logWebSocket("[CP-1] Inter-Component Communication analysis done: " + BinaryAppProtoBuf);
                logWebSocket("[CP-1] Building JSMF model from the Inter-Component Communication...");
                protoBufModels.build(IC3Proto, IC3ProtoGrammar,
                                    IC3EntryPoint, BinaryAppProtoBuf);
                logWebSocket("[CP-1] JSMF model builed.");
                }
                logWebSocket(`[CP-1] child process exited with code ${code}`);
        });


        // Generation of the model of application's source code.
        //
        logWebSocket('Launching a child process (CP-2) in order to decompile the APK.');
        logWebSocket('[CP-2] convert .dex file to .class files (zipped as jar)...')
        const cmd_decompile_step1 = spawn('bin/dex2jar/d2j-dex2jar.sh',
                                            ['--force','--output',
                                            bin_outputs+'/result-dex2jar.jar',
                                            req.file.path]);

        cmd_decompile_step1.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
        });

        cmd_decompile_step1.on('close', (code) => {
            if (code ==0)
            {
                logWebSocket('[CP-2] decompiling .class files with jd-cmd...')
                const cmd_decompile_step2 = spawn('java',
                                        ['-jar', 'bin/jd-cmd/jd-cli.jar',
                                        '--outputDir', bin_outputs+'/result-jdcmd',
                                        bin_outputs+'/result-dex2jar.jar']);

                cmd_decompile_step2.on('close', (code) => {
                        logWebSocket(`[CP-2] APK decompiled.`);
                        logWebSocket(`[CP-2] child process exited with code ${code}`);
                    })
            }
        });
    }

    else {
        req.flash("error", "You must submit a *.apk or *.dat file.");
    }

    res.redirect("/");
});


function logWebSocket(msg) {
    console.log(msg)
    //var nsp = io.of('/news');
    //nsp.emit('news', 'hello');
    io.emit('news', msg);
    // io.on('connection', function (socket) {
    //     socket.emit('news', msg);
    // });
};


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
