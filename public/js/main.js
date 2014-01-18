$(document).ready(function () {
    var hostname, client;

    hostname = window.location.hostname;
    client = new BinaryClient('ws://' + hostname + ':9000');

    client.on('open', function () {
        var stream = client.send({}, {
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
                
                $a.text(file).click(function (e) {
                    play.call(this, e, client);
                });
            });
        });

        $video.attr({
            controls: true,
            type    : 'video/mp4'
        });

        $box.on('dragenter', fizzle);
        $box.on('dragover', fizzle);
        $box.on('drop', function (e) {
            upload.call(this, e, client);
        });
    });

    client.on('stream', streamVideo);
});
