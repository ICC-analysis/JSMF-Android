# protobuff (Google Protocol Buffer format) To JSMF Metamodel

This module propose to use PEGJS Grammar to build a JSMF metamodel from a protobuf file (.proto).
It is currently under construction and may have several bugs and issues (tested only with IC3Data protobuf file).
For description explaination about IC3:  http://siis.cse.psu.edu/ic3/

## Install

Install all dependencies from npm : 
Thanks to npm: `npm install`

## Usage
`node jsmfBuilder.js` to build a JSMF metamodel from ic3data.proto (kind of schema) file using PEGJS grammar.

`node builder.js` build a JSMF model from an ic3 example file (also build the metamodel from the ic3data.proto schema)

## Rational

We want to use JSMF Metamodel as an javascript API to build model from protobuf received messages.
IC3 is our first attempt

## Further Work

This is a basic experiment for building a grammar generator that relates JSMF model elements with textual languages elements.

