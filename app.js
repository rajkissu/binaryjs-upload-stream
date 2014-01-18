/**
 * File Uploading and Streaming with BinaryJS
 */
'use strict';

var express, http, path, app, BinaryServer, fs, uploadPath, server, bs;

express      = require('express');
http         = require('http');
path         = require('path');
app          = express();
BinaryServer = require('binaryjs').BinaryServer;
fs           = require('fs');
uploadPath   = __dirname + '/files';

// all environments
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

server = http.createServer(app);

console.log(server.listen.toString());
server.listen(3000, function () {
    console.log('Video Server started on http://0.0.0.0:3000');
});

bs = new BinaryServer({ port: 9000 });

bs.on('connection', function (client) {
    client.on('stream', function (stream, meta) {
        switch(meta.op) {
            case 'list':
                list(stream, meta);
                break;

            case 'play':
                play(client, meta);
                break;

            default:
                // attempt an upload
                upload(stream, meta);
        }
    });
});

function list(stream, meta)  {
    fs.readdir(uploadPath, function (err, files) {
        stream.write({
            files: files
        });
    });
}

function play(client, meta) {
    var file = fs.createReadStream(uploadPath + '/' + meta.name);

    client.send(file);
}

function upload(stream, meta) {
    if (meta.type !== 'video/mp4') {
        stream.write({ err: 'Unsupported type: ' + meta.type });
        stream.end();
        return;
    }

    var file = fs.createWriteStream(uploadPath + '/' + meta.name);
    stream.pipe(file);

    stream.on('data', function (data) {
        stream.write({
            rx: data.length / meta.size
        });
    });

    stream.on('end', function () {
        stream.write({ end: true });
    });
}
