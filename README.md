# File Uploading and Streaming with Node.js

A while back, if you wanted to stream binary data via JavaScript - such as
audio/video content, you'd be sore out of luck :(

You'd have to rely on either Flash, Java applets or 3rd party plugins that
provided similar functionality. Uggh.

Over the past few years, advancements in JavaScript on both fronts: server-side
and client-side, now allow you to do so without having to resort to otherwise
tedious workarounds.

In this post, I'll show you how to upload and stream video files - yup, you heard
that right :)

How exactly do you ask? By using an awesome Node module called BinaryJS, and
some good ol' client-side Javascripting!

## What We'll Need

Before we can get started writing code to stream binary data, we need to install
some modules. We'll only need two: `express` and `binaryjs`.

### Express

The defacto Node.js web framework! My framework of choice, and that of many fellow
Node developers out there. It's fast, easy-to-use and well-documented.

To familiarize yourself with the `express` API, if you haven't already done so,
check out the official [ExpressJS API documentation](http://www.expressjs.com/api.html)

If `express` is not your cup of tea, you're most welcome to opt it out for something
you're more comfortable with.

### BinaryJS

The heart of our video streaming web app! This module uses WebSockets and the
BinaryPack serialization scheme to stream binary content back-and-forth between
the server and the client.

Want to find out more? Here's the official [BinaryJS Website](http://www.binaryjs.com/),
and here's the [API documentation](https://github.com/binaryjs/binaryjs/tree/master/doc)
for good measure.

## The Workflow

First off, I'll outline the workflow for both the server and client portions of
the video server we're building.

### Server-side

1. Create an instance of the BinaryJS server
2. Register custom events and handlers for:

* uploading videos
* requesting for a video
* listing available videos

### Client-side

1. Create an instance of the BinaryJS client
2. Upon connecting to the BinaryJS server, retrieve a list of available videos and present it
3. Clicking a link in the video list should load the affected video
4. Add a means to upload video files:

* use **Drag n Drop** for a better UX experience
* refresh the list of available videos

## Installation

First off, install the modules in your project directory via npm. I've added
the version numbers that were installed for me:

* Express v3.4.6
* BinaryJS v0.2.1

```
$ npm install express
$ npm install binaryjs
```

Next up, bootstrap your web app using express:

```
$ node_modules/express/bin/express .
```

Or if you have express installed globally:

```
$ express .
```

Remove the directories we don't need:

```
$ rm -rf routes/ views/
```

Replace the generated copy of `package.json` with this:

```
{
    "name": "binaryjs-upload-stream",
    "version": "0.1.0",
    "private": true,
    "scripts": {
        "start": "node app.js"
    },
    "dependencies": {
        "express": "3.4.6",
        "binaryjs": "0.2.1"
    }
}
```

Also, don't forget to clear out irrelevant code in `app.js`:

```
// remove these lines
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// we won't need routing too
app.get('/', routes.index);
app.get('/users', user.list);
```

For the finishing touch, I renamed some directories in `public/`. This is a
matter of preference and therefore entirely optional.

```
$ cd public/
$ ls

images  javascript  stylesheets

$ mv javascript/ js/
$ mv stylesheets/ css/
```

## Coding The Backend

### app.js

Open up `app.js` and start coding! You'll need to create an
instance of `BinaryServer`, which the `binaryjs` module provides.

Also, add a reference to the `video` library for later.

```
// add these two lines near the variable declarations at the top
BinaryServer = require('binaryjs').BinaryServer;
video        = require('./lib/video');
```

I set my instance to run on port `9000`. If you don't specify a custom port,
it'll piggyback on whatever port you've set on `express` after which you'll
need to set a custom endpoint.

```
// add this after the call to server.listen()
bs = new BinaryServer({ port: 9000 });
```

Now we set the `connection` handler for the `binaryjs` server.
It provides a `client` object which is of type `binaryjs.BinaryClient`

The client's `stream` event returns both a `stream` object as well as a `meta` object, configurable from the client-side.

Add handlers for the following meta events:

* `list`
* `request`
* `upload`

```
bs.on('connection', function (client) {
    client.on('stream', function (stream, meta) {
        switch(meta.event) {
        // list available videos
        case 'list':
            video.list(stream, meta);
            break;

        // request for a video
        case 'request':
            video.request(client, meta);
            break;

        // attempt an upload
        case 'upload':
        default:
            video.upload(stream, meta);
        }
    });
});
```

### video.js

Create a source file for managing the videos, I put mine in `lib/video.js`. This
file will house the implementations for the following capabilities:

* listing of available videos
* requesting of a video for playback
* uploading of a video to the server

```
var fs, uploadPath, supportedTypes;

fs             = require('fs');
uploadPath     = __dirname + '/../videos';
supportedTypes = [
    'video/mp4',
    'video/webm',
    'video/ogg'
];

module.exports = {
    list    : list,
    request : request,
    upload  : upload
};
```

The `list` function does the simple task of reading filenames in
the `videos/` directory and streaming back a list of it to the client.

```
function list(stream, meta)  {
    fs.readdir(uploadPath, function (err, files) {
        stream.write({ files : files });
    });
}
```

`request` creates a read stream for the requested video file, and streams
it in chunks back to the client.

```
function request(client, meta) {
    var file = fs.createReadStream(uploadPath + '/' + meta.name);

    client.send(file);
}
```

The file upload implementation in `upload` checks if the file is of a supported video type.

If the type matches, the function proceeds - otherwise, it returns an error.

For the sake of convenience, the function informs the client of the upload
status as it writes the video to disk, chunk by chunk.

```
function upload(stream, meta) {
    if (!~supportedTypes.indexOf(meta.type)) {
        stream.write({ err: 'Unsupported type: ' + meta.type });
        stream.end();
        return;
    }

    var file = fs.createWriteStream(uploadPath + '/' + meta.name);
    stream.pipe(file);

    stream.on('data', function (data) {
        stream.write({ rx: data.length / meta.size });
    });

    stream.on('end', function () {
        stream.write({ end: true });
    });
}
```

## Coding the Frontend

### index.html

Add the following HTML to your landing page's `<body>` tag.

```
<h1>BinaryJS File Upload and Streaming</h1>

<section id="main">
    <fieldset>
        <legend>Drag n Drop</legend>
        <aside id="upload-box">
            <article id="progress">Drop file here</article>
        </aside>
    </fieldset>

    <fieldset>
        <legend>Select a Link</legend>

        <nav id="list" class="left"></nav>
    </fieldset>

    <fieldset>
        <legend>Play the Video</legend>

        <section class="left">
            <video id="video"></video>
        </section>
    </fieldset>
</section>
```

Insert the following `<script>` tags at the end of the `<body>` tag in the order
specified.

```
<script src="/js/lib/binary.js"></script>
<script src="/js/lib/jquery.js"></script>
<script src="/js/lib/common.js"></script>
<script src="/js/lib/video.js"></script>
<script src="/js/main.js"></script>
```

### common.js

Before anything else can work client-side, make sure to create an
instance of `BinaryClient` with a port of `9000` - or whichever port
you have changed it to - and save this to `js/lib/common.js`.

```
var hostname, client;

hostname = window.location.hostname;
client   = new BinaryClient('ws://' + hostname + ':9000');
```

The `common.js` file also includes helper functions like `fizzle`,
used to prevent event propagation in JavaScript ...

```
function fizzle(e) {
    e.preventDefault();
    e.stopPropagation();
}
```

And `emit`, which is essentially a wrapper to the
`BinaryClient` method `send`.

`client.send` takes two arguments: tle file to be
streamed over to the video server, and the
accompanying meta data - in that order.

```
function emit(event, data, file) {
    file       = file || {};
    data       = data || {};
    data.event = event;

    return client.send(file, data);
}
```

### video.js

For `js/lib/video.js`, add functions that implement:

* retrieving of video listings from the video server
* uploading of a video file to the video server
* requesting of a video file from the video server
* downloading of a requested video file from the video server

```
function list(cb) {
    var stream = emit('list');

    stream.on('data', function (data) {
        cb(null, data.files);
    });

    stream.on('error', cb);
}
```

The `upload` method facilitates the uploading
of a file - the streaming, and the resulting
feedback of the upload as it progresses.

```
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
```

The `request` function is nothing more than a
wrapper function for the `request` event:

```
function request(name) {
    emit('request', { name : name });
}
```

In order to get downloading to work, the chunks of video data that
get streamed in as `ArrayBuffer` objects need to be stitched together
in a `Blob` instance.

The `src` object, containing the newly formed `Blob`, can then be returned
in a callback.

```
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
```

### main.js

The final file, `js/main.js` ties the presentation layer with application logic.

Once the connection is up, as denoted by the `open` event, add handling for
video listings and Drag n' Drop.

```
client.on('open', function () {
    video.list(setupList);
    $box.on('drop', setupDragDrop);
});
```

In the `stream` event, we assume that anything that gets streamed back
without initiation from the client-side (list, video request, etc) is
undoubtedly a video file.

```
client.on('stream', function (stream) {
    video.download(stream, function (err, src) {
        $video.attr('src', src);
    });
});
```

`setupList` refreshes the file listing visuals everytime a list request
is sent.

```
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
```

`setupDragDrop` contains logic for dragging and dropping a file
into the "drop" box (saw what I did there?), after which it
initiates the upload of said file.

The progress is indicated directly in the text of the "drop" box (there I did it
again!) as the file upload progresses.

```
function setupDragDrop(e) {
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
        
        if (data.end) {
            setTimeout(function () {
                $progress.fadeOut(function () {
                    $progress.text('Drop file here');
                }).fadeIn();
            }, 5000);
        }
    });
}
```

## Putting it Together

Alright, we're just about ready to test it out! Make sure to start your server
up:

```
$ node app.js
```

Access the landing site via your browser

![Load the Landing Site](https://github.com/rajkissu/binaryjs-upload-stream/raw/master/images/load.png)

Drag and drop a video file into the gray box

![Drag n Drop a video file](https://github.com/rajkissu/binaryjs-upload-stream/raw/master/images/drop.png)

Click a video link and watch it stream

![Play a video file](https://github.com/rajkissu/binaryjs-upload-stream/raw/master/images/play.png)

And there you have it - your very own, video server with support for uploading
and streaming. Written in Node!

## Caveats

I've tested uploading of video files both small and large - and they work fine.

Of course, since the example uses the html5 `<video>` tag, supported formats are
limited to `video/mp4`, `video/webm` and `video/ogg`.

Streaming of large video files, however, takes a while and may freeze the
page. Proceed with caution - you have been warned!

BinaryJS's client-side component works with the following browsers:

* Chrome 15+
* Firefox 11+
* Internet Explorer 10
* Safari nightly builds

If you're on an older browser, well ...

Why are you using an older browser again?

## Sourcecode

For the full source - which includes the stuff I missed during the tutorial (css, helper functions, etc) -
grab the tarball over [here](http://github.com/rajkissu/binaryjs-upload-stream). Alternatively, visit the
Github page over [here](https://github.com/rajkissu/binaryjs-upload-stream).

## Going Further

There's more you can do to spruce up this example that is well beyond the
scope of this tutorial, such as:

* robust error handling
* MIME type checks on the server side after the file has been uploaded
* a full-fledged Audio on Demand/Video on Demand server
* adaptive bitrate streaming for clients with varying bandwidth and CPU capacity
* anymore that you can think of goes here ...

If you do decide to build something along those lines, feel free to share it
over here in the comments section, so the rest of us can revel in awe!

Well that's it folks, I hope you enjoyed my very first Node.js tutorial
@ OlinData, expect more to come in the near future :)
