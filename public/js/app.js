var $video, $box, $progress, $list;

$video    = $('#video');
$box      = $('#upload-box');
$progress = $('#progress');
$list     = $('#list');

function upload(e, client) {
    var event, file, stream, tx;

    event = e.originalEvent;

    event.preventDefault();
    file = event.dataTransfer.files[0];

    stream = client.send(file, {
        name: file.name,
        size: file.size,
        type: file.type
    });

    tx = 0;

    stream.on('data', function (data) {
        var msg;

        if (data.end) {
            msg = "Upload complete: " + file.name;
        } else if (data.rx) {
            msg = Math.round(tx += data.rx * 100) + '% complete';
        } else {
            // assume error
            msg = data.err;
        }

        $progress.text(msg);
    });
}

function play(e, client) {
    var stream = client.send({}, {
        op   : 'play',
        name : $(this).text()
    });
}

function streamVideo(stream, meta) {
    var parts = [];

    stream.on('data', function (data) {
        parts.push(data);
    });

    stream.on('end', function () {
        var src = (window.URL || window.webkitURL).createObjectURL(new Blob(parts));

        $video.attr('src', src);
    });
}

function fizzle(e) {
    e.preventDefault();
    e.stopPropagation();
}
