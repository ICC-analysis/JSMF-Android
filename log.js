'use strict'



function logWebSocket(io, msg) {
    console.log(msg)
    //var nsp = io.of('/news');
    //nsp.emit('news', 'hello');
    io.emit('news', msg);
    // io.on('connection', function (socket) {
    //     socket.emit('news', msg);
    // });
};

module.exports = {
    log_web_socket: logWebSocket
};
