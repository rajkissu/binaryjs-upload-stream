var video = (function () {
    return {
        list     : list,
        upload   : upload,
        request  : request,
        download : download
    };

    function list(cb) {
        var stream = emit('list');

        stream.on('data', function (data) {
            cb(null, data.files);
        });

        stream.on('error', cb);
    }

    function upload(file, cb) {
        var stream = emit('upload', {
            name  : file.name,
            size  : file.size,
            type  : file.type
        }, file);

        stream.on('data', function (data) {
            cb(null, data);
        });

        stream.on('error', cb);
    }

    function request(name) {
        emit('request', { name : name });
    }

    function download(stream, cb) {
        var parts = [];

        stream.on('data', function (data) {
            parts.push(data);
        });

        stream.on('error', function (err) {
            cb(err);
        });

        stream.on('end', function () {
            var src = (window.URL || window.webkitURL).createObjectURL(new Blob(parts));

            cb(null, src);
        });
    }
})();
