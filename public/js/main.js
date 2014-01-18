$(document).ready(function () {
    var $video, $box, $progress, $list;

    $video    = $('#video');
    $box      = $('#upload-box');
    $progress = $('#progress');
    $list     = $('#list');

    client.on('open', function () {
        var stream = emit({
            op: 'list'
        });

        stream.on('data', function (data) {
            var files, $ul, $li;

            $list.empty();
            files = data.files;
            $ul   = $('<ul>').appendTo($list);

            files.forEach(function (file) {
                $li = $('<li>').appendTo($ul);
                $a  = $('<a>').appendTo($li);
                
                $a.attr('href', '#').text(file).click(request);
            });
        });

        $video.attr({
            controls: true,
            type    : 'video/mp4'
        });

        $box.on('dragenter', fizzle);
        $box.on('dragover', fizzle);
        $box.on('drop', upload);
    });

    client.on('stream', function (stream, meta) {
        download(stream, meta, function (err, src) {
            $video.attr('src', src);
        });
    });
});
