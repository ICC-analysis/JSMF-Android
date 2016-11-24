var build = require('./builder.js');

var IC3Proto = './var/ic3/ic3data.proto',
  IC3ProtoGrammar = './var/ic3/grammar.pegjs',
  IC3EntryPoint = 'edu.psu.cse.siis.ic3.Application',
  BinaryAppProtoBuf = './var/apps/a2dp.Vol_107.dat'

build.build(IC3Proto, IC3ProtoGrammar, IC3EntryPoint, BinaryAppProtoBuf)


console.log(build.model);
