var Promise = require('promise');
const spawn = require('child_process').spawn;
var japa = require("java-parser");
var protoBufModels =  require('builder');

var io = require('./bootstrap.js').io;
var log_web_socket = require('./bootstrap.js').log_web_socket;

var bin_outputs = 'outputs/';

var IC3Proto = require('./conf.js').IC3Proto,
  IC3ProtoGrammar = require('./conf.js').IC3ProtoGrammar,
  IC3EntryPoint = require('./conf.js').IC3EntryPoint,
  BinaryAppProtoBuf = require('./conf.js').BinaryAppProtoBuf

function start_process(req) {
    // return new Promise(function (fullfill, reject) {
    //     B();
    // }).then(A())

    var promises = [generate_ICC_model, generate_source_code_model]
                    .map(function(name) {
                        return new Promise(function(fullfill, reject) {
                            name(req);
                            fullfill();
                        })
                    })

    Promise.all(promises)
    .then(function () {})
    .catch(console.error);
}



function log_web_socket(io, msg) {
    console.log(msg);
}


function generate_ICC_model(req) {
    // Generation of the model of application's
    // "Inter-Component Communication" representation.
    //

    var msg = 'Launching a child process (CP-1) in order to retarget and ' +
    'generate a binary proto file.'
    log_web_socket(io, msg);

    log_web_socket(io, "[CP-1] analysis of the Inter-Component Communication with IC3...");
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
            log_web_socket(io, "[CP-1] Inter-Component Communication analysis done: " + BinaryAppProtoBuf);
            log_web_socket(io, "[CP-1] Building JSMF model from the Inter-Component Communication...");
            protoBufModels.build(IC3Proto, IC3ProtoGrammar,
                                IC3EntryPoint, BinaryAppProtoBuf);
            M = protoBufModels.model;
            log_web_socket(io, "[CP-1] JSMF model builed.");
            }
            log_web_socket(io, `[CP-1] child process exited with code ${code}`);
    });
    console.log('B end');
    return true;
}

function generate_source_code_model(req) {
    // Generation of the model of application's source code.
    //
    log_web_socket(io, 'Launching a child process (CP-2) in order to decompile the APK.');
    log_web_socket(io, '[CP-2] convert .dex file to .class files (zipped as jar)...')
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
            log_web_socket(io, '[CP-2] decompiling .class files with jd-cmd...')
            const cmd_decompile_step2 = spawn('java',
                                    ['-jar', 'bin/jd-cmd/jd-cli.jar',
                                    '--outputDir', bin_outputs+'/result-jdcmd',
                                    bin_outputs+'/result-dex2jar.jar']);

            cmd_decompile_step2.on('close', (code) => {
                    log_web_socket(io, `[CP-2] APK decompiled.`);
                    //log_web_socket(io, `[CP-2] child process exited with code ${code}`);
            })


            // cmd.on('disconnect', function() {
            //     console.log('parent exited')
            //     cmd.exit();
            //
            //     var source_code_ast =  {};
            //     M.modellingElements['Component'].map(function(component) {
            //         var file = bin_outputs + 'result-jdcmd/' +
            //                     component.name.replace(/\./g, '/') + '.java';
            //         var content;
            //         try {
            //               content = fs.readFileSync(file, 'utf-8')
            //         } catch (err) {
            //               //console.log(err);
            //               console.log("Error when reading: " + file);
            //         }
            //
            //         try {
            //             source_code_ast[component.name] = japa.parse(content);
            //         }
            //         catch (err) {
            //             //console.log(err);
            //             console.log("Unable to create AST for: " + component.name);
            //         }
            //
            //     });
            //
            //     //var source_code_ast_serialized = serialize.serialize(source_code_ast);
            //     var source_code_ast_serialized = JSON.stringify(source_code_ast);
            //     fs.writeFile("/tmp/testS", source_code_ast_serialized, function(err) {
            //         if(err) {
            //             return console.log(err);
            //         }
            //             console.log("The file was saved!");
            //     });
            // });


        }
    });
}



module.exports = {
    start_process: start_process
};
