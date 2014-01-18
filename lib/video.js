/**
 * Manages uploading and streaming of video files.
 *
 * @module video
 */
'use strict';

var uploadPath, fs;

uploadPath = __dirname + '/../videos';
fs         = require('fs');

module.exports = {
    list    : list,
    request : request,
    upload  : upload
};

/**
 */
function list(stream, meta)  {
    fs.readdir(uploadPath, function (err, files) {
        stream.write({ files : files });
    });
}

/**
 */
function request(client, meta) {
    var file = fs.createReadStream(uploadPath + '/' + meta.name);

    client.send(file);
}

/**
 */
function upload(stream, meta) {
    if (meta.type !== 'video/mp4') {
        stream.write({ err: 'Unsupported type: ' + meta.type });
        stream.end();
        return;
    }

    var file = fs.createWriteStream(uploadPath + '/' + meta.name);
    stream.pipe(file);

    stream.on('data', function (data) {
        stream.write({ rx : data.length / meta.size });
    });

    stream.on('end', function () {
        stream.write({ end: true });
    });
}
