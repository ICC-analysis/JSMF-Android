'use strict'

const peg = require('pegjs')
const fs = require('fs')
const JSMF = require('jsmf-core')

const conf = require('./conf.js');

function parse(grammar, source_code) {
    // the grammar.pegjs
    var parser = peg.generate(fs.readFileSync(grammar,'utf-8'))

    var MMJava = parser.parse(fs.readFileSync(source_code,'utf-8'),
                                {jsmf:JSMF});

    console.log(MMJava);
    //console.log(MMJava['types'][0]['bodyDeclarations'][2]['body']['statements'][1]);

    //Exports the metamodel of IC3 protocol buffer metamodel
    exports.metamodel = MMJava
}

parse(conf.JAVAGrammar,
    'outputs/result-jdcmd/de/rub/syssec/receiver/OnAlarmReceiver.java');

exports.parse = parse;
