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



app.listen(listening_port, function () {
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

app.post('/upload', upload.single('file'), function(req,res,next) {
 console.log(req.file);

  if (req.file && req.file.originalname.split('.').pop() == "dat") {
    // A binary protobuf is directly submitted
  	BinaryAppProtoBuf = req.file.path;
  	//relaunch the protobufModel construction
  	protoBufModels.build(IC3Proto, IC3ProtoGrammar,
                        IC3EntryPoint, BinaryAppProtoBuf);
  }

  else if (req.file && req.file.originalname.split('.').pop() == "apk") {
    // An APK is submitted
    console.log('An APK file has been received: ' + req.file.originalname)


    console.log('Launching a child process in order to retarget and generate a binary proto file.')
  	const spawn = require('child_process').spawn;
    const cmd = spawn('bin/APK-analyzer/apk2icc.sh', [req.file.path, req.file.originalname]);

    cmd.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
    });

    cmd.stdout.on('data', (data) => {
        //console.log(`stdout: ${data}`);
    });

    cmd.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
        if (code ==0)
        {
            BinaryAppProtoBuf = 'outputs/ic3/'+req.file.filename+'/result.dat'
            console.log("File generated: " + BinaryAppProtoBuf);
            console.log("Building JSMF model...")
            protoBufModels.build(IC3Proto, IC3ProtoGrammar,
                                IC3EntryPoint, BinaryAppProtoBuf);
            console.log("JSMF model builed.")
        }
    });


    console.log('Launching a child process in order to decompile the APK.');
    console.log(req.file.path)
    const cmd_decompile = spawn('bin/dex2jar/d2j-dex2jar.sh',
                                ['--force','--output',
                                './outputs/result-dex2jar.jar', req.file.path]);

    cmd_decompile.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
    });

    cmd_decompile.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
        if (code ==0)
        {
            console.log('decompiling with jd-cmd...')
            const cmd_decompile2 = spawn('java',
                                        ['-jar', 'bin/jd-cmd/jd-cli.jar',
                                        '--outputDir', './outputs/result-jdcmd',
                                        './outputs/result-dex2jar.jar']);
        }
    });


  }

  else if (req.file) {
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
