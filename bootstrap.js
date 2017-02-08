'use strict'
var express = require('express');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var log_web_socket = require('./log').log_web_socket;

module.exports = {
    app: app,
    express: express,
    http: http,
    io: io,
    log_web_socket: log_web_socket
};
