var hostname, client;

hostname = window.location.hostname;

client = new BinaryClient('ws://' + hostname + ':9000');

function upload(e, cb) {
    var file, stream, tx;

    fizzle(e);

    file   = e.dataTransfer.files[0];
    stream = emit(file, {
        name : file.name,
        size : file.size,
        type : file.type
    });

    tx = 0;

    stream.on('data', function (data) {
        var msg;

        if (data.end) {
            msg = "Upload complete: " + file.name;
        } else if (data.rx) {
            msg = Math.round(tx += data.rx * 100) + '% complete';

            emit({ op: 'list' });
        } else {
            // assume error
            msg = data.err;
        }

        $progress.text(msg);
    });
}

function request(e) {
    fizzle(e);

    var stream = emit({
        op   : 'request',
        name : $(this).text()
    });
}

function download(stream, meta, cb) {
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

function emit(msg) {
    return client.send({}, msg);
}
