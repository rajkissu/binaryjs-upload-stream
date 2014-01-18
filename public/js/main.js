$(document).ready(function () {
    var $video, $box, $progress, $list;

    $video    = $('#video');
    $box      = $('#upload-box');
    $progress = $('#progress');
    $list     = $('#list');

    client.on('open', function () {
        video.list(setupList);

        $video.attr({
            controls: true,
            type    : 'video/mp4'
        });

        $box.on('dragenter', fizzle);
        $box.on('dragover', fizzle);
        $box.on('drop', function (e) {
            fizzle(e);

            var file, tx;

            file = e.originalEvent.dataTransfer.files[0];
            tx   = 0;

            video.upload(file, function (err, data) {
                var msg;

                if (data.end) {
                    msg = "Upload complete: " + file.name;

                    video.list(setupList);
                } else if (data.rx) {
                    msg = Math.round(tx += data.rx * 100) + '% complete';

                } else {
                    // assume error
                    msg = data.err;
                }

                $progress.text(msg);
            });
        });
    });

    client.on('stream', function (stream, meta) {
        video.download(stream, meta, function (err, src) {
            $video.attr('src', src);
        });
    });

    function setupList(err, files) {
        var $ul, $li;

        $list.empty();
        $ul   = $('<ul>').appendTo($list);

        files.forEach(function (file) {
            $li = $('<li>').appendTo($ul);
            $a  = $('<a>').appendTo($li);

            $a.attr('href', '#').text(file).click(video.request);
        });
    }
});
