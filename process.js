'use strict'
//const fs = require('fs');
const path = require('path');
//const Promise = require('promise');
const Promise = require("bluebird");
const join = Promise.join;
const fs = Promise.promisifyAll(require("fs"));
const spawn = require('child_process').spawn;
const japa = require("java-parser");
var protoBufModels =  require('builder');

const io = require('./bootstrap.js').io;
const log_web_socket = require('./bootstrap.js').log_web_socket;

const conf = require('./conf.js');
var IC3Proto = require('./conf.js').IC3Proto,
IC3ProtoGrammar = require('./conf.js').IC3ProtoGrammar,
IC3EntryPoint = require('./conf.js').IC3EntryPoint,
BinaryAppProtoBuf = require('./conf.js').BinaryAppProtoBuf

var M = null;
var ICCmodelReady = false;
var APK_decompiled = false;


function start_process(file) {
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

    // Before launching the process, clean the folder where outputs of
    // subprocesses are stored
    const spawn_sync = require('child_process').spawnSync;
    //spawn_sync('rm', ['-Rf', conf.bin_outputs]);

    // Generation of the models
    var promises = [generate_ICC_model, generate_source_code_model]
    .map(function(name) {
        return new Promise(function(fullfill, reject) {
            name(file);
            fullfill();
        })
    })
    Promise.all(promises)
    .catch(console.error);

    // Generation of the AST
    ensureICCmodelReadyAndAPKdecompiled().then(function(){
        generate_ast();
    })
    .then(function() {
        // clean the uploads folder
        // fs.readdir(conf.uploads_folder, (err, files) => {
        //   if (err) throw error;
        //
        //   for (const file of files) {
        //     fs.unlink(path.join(conf.uploads_folder, file), err => {
        //       if (err) throw err;
        //     });
        //   }
        // });
    })
    .catch(console.error);
}


function generate_ast() {
    log_web_socket(io, "[CP-3] AST generation...");

    Promise.map(M.modellingElements['Component'], function(component) {
        // Promise.map awaits for returned promises as well.
        var name = component.name || component.class_name;
        if (name) {
            var file = conf.bin_outputs + 'result-jdcmd/' +
            name.replace(/\./g, '/')  + '.java';
            var content = fs.readFileAsync(file, 'utf-8').catch(function ignore() {});;
            return join(name, content, function(name, content) {
                return {
                    name: name,
                    content: content
                }
            });
        }
    }).then(function(result) {
        var source_code_ast =  {};
        result.map(function (elem) {
            try {
                source_code_ast[elem.name] = japa.parse(elem.content);
            }
            catch (err) {
                // console.log(err);
                log_web_socket(io, "[CP-3] stderr: Unable to create AST for: " + elem.name);
            }
        })

        var source_code_ast_serialized = JSON.stringify(source_code_ast);
        fs.writeFile(conf.bin_outputs + 'apk_ast.json',
        source_code_ast_serialized, function(err) {
            if(err) {
                return console.log(err);
            }
            log_web_socket(io, "[CP-3] AST generated.");
        });
    });
}

function generate_ICC_model(file) {
    // Generation of the model of application's
    // "Inter-Component Communication" representation.
    //
    log_web_socket(io, 'Launching a child process (CP-1) in order to ' +
    'retarget and generate a binary proto file.');

    log_web_socket(io, "[CP-1] analysis of the Inter-Component Communication with IC3...");
    const cmd = spawn('bin/APK-analyzer/apk2icc.sh', [file.path, file.originalname]);

    cmd.stderr.on('data', (data) => {
        if (data && data.length > 1) {
            //log_web_socket(io, `[CP-1] stderr: ${data}`);
            console.log(`[CP-1] stderr: ${data}`);
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
            file.filename + '/result.dat';
            log_web_socket(io, "[CP-1] Inter-Component Communication analysis done.");
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

    function generate_source_code_model(file) {
        // Generation of the model of application's source code.
        //
        log_web_socket(io, 'Launching a child process (CP-2) in order to decompile the APK.');
        log_web_socket(io, '[CP-2] convert .dex file to .class files (zipped as jar)...')
        const cmd_decompile_step1 = spawn('bin/dex2jar/d2j-dex2jar.sh',
        ['--force','--output',
        conf.bin_outputs+'/result-dex2jar.jar',
        file.path]);

        cmd_decompile_step1.stderr.on('data', (data) => {
            if (data && data.length > 1) {
                //log_web_socket(io, `[CP-2] stderr: ${data}`);
                console.log(`[CP-2] stderr: ${data}`);
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
                        //log_web_socket(io, `[CP-2] stderr: ${data}`);
                        console.log(`[CP-2] stderr: ${data}`);
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
