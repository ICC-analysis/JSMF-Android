'use strict'

const peg = require('pegjs')
const fs = require('fs')
const JSMF = require('jsmf-core')


function parse(IC3ProtoGrammar, IC3Proto) {
  // the grammar.pegjs
  var parser = peg.generate(fs.readFileSync(IC3ProtoGrammar,'utf-8'))

  //the protoBuf file defining the schema/metamodel of the data (here comming from IC3 analyser)
  var MMProtoBuf = parser.parse(fs.readFileSync(IC3Proto,'utf-8'),
                                {jsmf:JSMF})

  //Exports the metamodel of IC3 protocol buffer metamodel
  exports.metamodel = MMProtoBuf
}

exports.parse = parse;
