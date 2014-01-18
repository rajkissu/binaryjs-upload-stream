/**
 * File Uploading and Streaming with BinaryJS
 */
'use strict';

var BinaryServer, express, http, path, app, video, server, bs;

BinaryServer = require('binaryjs').BinaryServer;
express      = require('express');
http         = require('http');
path         = require('path');
app          = express();
video        = require('./lib/video');

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

server.listen(3000, function () {
    console.log('Video Server started on http://0.0.0.0:3000');
});

bs = new BinaryServer({ port: 9000 });

bs.on('connection', function (client) {
    client.on('stream', function (stream, meta) {
        switch(meta.op) {
            // list available videos
            case 'list':
                video.list(stream, meta);
                break;

            // request for a video
            case 'request':
                video.request(client, meta);
                break;

            default:
                // attempt an upload
                video.upload(stream, meta);
        }
    });
});
