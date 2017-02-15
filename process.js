'use strict'
var fs = require('fs');
var Promise = require('promise');
const spawn = require('child_process').spawn;
var japa = require("java-parser");
var protoBufModels =  require('builder');

var io = require('./bootstrap.js').io;
var log_web_socket = require('./bootstrap.js').log_web_socket;

var conf = require('./conf.js');
var IC3Proto = require('./conf.js').IC3Proto,
  IC3ProtoGrammar = require('./conf.js').IC3ProtoGrammar,
  IC3EntryPoint = require('./conf.js').IC3EntryPoint,
  BinaryAppProtoBuf = require('./conf.js').BinaryAppProtoBuf

var M = null;
var ICCmodelReady = false;
var APK_decompiled = false;


function start_process(req) {
    // return new Promise(function (fullfill, reject) {
    //     B();
    // }).then(A())

    ICCmodelReady = false;
    APK_decompiled = false;

    function ensureICCmodelReadyAndAPKdecompiled() {
        return new Promise(function (resolve, reject) {
            (function waitForContitions(){
                if (ICCmodelReady && APK_decompiled) return resolve();
                setTimeout(waitForContitions, 30);
            })();
        });
    }


    // clean the folder where outputs of subprocess are stored
    const spawn_sync = require('child_process').spawnSync;
    spawn_sync('rm', ['-Rf', conf.bin_outputs]);

    var promises = [generate_ICC_model, generate_source_code_model]
                    .map(function(name) {
                        return new Promise(function(fullfill, reject) {
                            name(req);
                            fullfill();
                        })
                    })

    Promise.all(promises)
    .then(function() {
        //spawn_sync('rm', ['-Rf', conf.uploads_folder]);
    })
    .catch(console.error);


    ensureICCmodelReadyAndAPKdecompiled().then(function(){
        log_web_socket(io, "[CP-3] AST generation...");

        var source_code_ast =  {};
        M.modellingElements['Component']
        //.concat(M.modellingElements['Instruction'])
        .map(function(component) {
            var name = component.name || component.class_name;
            if (name) {
                var file = conf.bin_outputs + 'result-jdcmd/' +
                            name.replace(/\./g, '/')  + '.java';
                var content;
                try {
                      content = fs.readFileSync(file, 'utf-8');
                } catch (err) {
                      //console.log(err);
                      console.log("Error when reading: " + file);
                }

                try {
                    source_code_ast[component.name] = japa.parse(content);
                }
                catch (err) {
                    console.log(err);
                    log_web_socket(io, "[CP-3] stderr: Unable to create AST for: " + component.name);
                }
            }

        });

        //var source_code_ast_serialized = serialize.serialize(source_code_ast);
        var source_code_ast_serialized = JSON.stringify(source_code_ast);
        fs.writeFile("/tmp/testS", source_code_ast_serialized, function(err) {
            if(err) {
                return console.log(err);
            }
            log_web_socket(io, "[CP-3] AST generated.");
        });
    })
    .catch(console.error);
}





function generate_ICC_model(req) {
    // Generation of the model of application's
    // "Inter-Component Communication" representation.
    //
    log_web_socket(io, 'Launching a child process (CP-1) in order to ' +
                        'retarget and generate a binary proto file.');

    log_web_socket(io, "[CP-1] analysis of the Inter-Component Communication with IC3...");
    const cmd = spawn('bin/APK-analyzer/apk2icc.sh', [req.file.path, req.file.originalname]);

    cmd.stderr.on('data', (data) => {
        if (data && data.length > 1) {
            log_web_socket(io, `[CP-1] stderr: ${data}`);
        }
    });

    cmd.stdout.on('data', (data) => {
        //console.log(`stdout: ${data}`);
        //io.emit('news', data);
    });

    cmd.on('close', (code) => {
        if (code == 0)
        {
            BinaryAppProtoBuf = conf.bin_outputs + 'ic3/' +
                                req.file.filename + '/result.dat';
            log_web_socket(io, "[CP-1] Inter-Component Communication analysis done: " + BinaryAppProtoBuf);
            log_web_socket(io, "[CP-1] Building JSMF model from the Inter-Component Communication...");
            protoBufModels.build(IC3Proto, IC3ProtoGrammar,
                                IC3EntryPoint, BinaryAppProtoBuf);
            M = protoBufModels.model;
            ICCmodelReady = true;
            log_web_socket(io, "[CP-1] JSMF model built.");
        }
        log_web_socket(io, `[CP-1] child process exited with code ${code}`);
    });
    return true;
}

function generate_source_code_model(req) {
    // Generation of the model of application's source code.
    //
    log_web_socket(io, 'Launching a child process (CP-2) in order to decompile the APK.');
    log_web_socket(io, '[CP-2] convert .dex file to .class files (zipped as jar)...')
    const cmd_decompile_step1 = spawn('bin/dex2jar/d2j-dex2jar.sh',
                                        ['--force','--output',
                                        conf.bin_outputs+'/result-dex2jar.jar',
                                        req.file.path]);

    cmd_decompile_step1.stderr.on('data', (data) => {
        if (data && data.length > 1) {
            log_web_socket(io, `[CP-2] stderr: ${data}`);
        }
    });

    cmd_decompile_step1.on('close', (code) => {
        if (code == 0)
        {
            log_web_socket(io, '[CP-2] decompiling .class files with jd-cmd...')
            const cmd_decompile_step2 = spawn('java',
                                ['-jar', 'bin/jd-cmd/jd-cli.jar',
                                '--outputDir', conf.bin_outputs+'/result-jdcmd',
                                conf.bin_outputs+'/result-dex2jar.jar']);

            cmd_decompile_step2.stderr.on('data', (data) => {
                if (data && data.length > 1) {
                    log_web_socket(io, `[CP-2] stderr: ${data}`);
                }
            });

            cmd_decompile_step2.on('close', (code) => {
                APK_decompiled = true;
                log_web_socket(io, '[CP-2] APK decompiled.');
                log_web_socket(io, `[CP-2] child process exited with code ${code}`);
            })
        }
    });
}


module.exports = {
    start_process: start_process
};
