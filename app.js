/*************************
 * Libraries
 *************************/

var express = require('express');
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
var storage = require('azure-storage');
var bodyParser = require('body-parser');
var cv = require('opencv');
var https = require('https');

/*************************
 * Local files
 *************************/

var apiController = require('./controller/apiController');

let connectionString = 'DefaultEndpointsProtocol=https;AccountName=poc3blob;AccountKey=yjYGFYPbgTWI2fPE87HycQJbWqMK1mtLP8o1MIXidwlKC/L6+m7YugyOTVMbLcnObjCO1sMx17wy4bPR3rSs7w==;EndpointSuffix=core.windows.net';
let blobService = storage.createBlobService(connectionString);
let app = express();

/**
 * Configure frameworks
 */
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

/********************************************
 * Controller
 ********************************************/
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.post('/upload', function(req, res) {
    let form = new formidable.IncomingForm();

    form.on('file', function(field, file) {

        form.uploadDir = path.join(__dirname, '/uploads');
        fs.rename(file.path, path.join(form.uploadDir, file.name));

        let filelocalPath = () => {
            if (process.platform === 'win32')
                return form.uploadDir + '\\' + file.name;
            else
                return form.uploadDir + '/' + file.name;
        };

        let video = new cv.VideoCapture(filelocalPath());
        let fps = 30;

        /**
         * Set the capture every X seconds
         * @type {number}
         */
        let capture_every_seconds = 1;

        let threshold = fps * capture_every_seconds;

        let counter = 0;
        let counter_img = 1;

        let result = '';

        /**
         * Iter through the video and capture one image every 'threshold'
         */
        let iter = () => {
            video.read(function(err, im) {
                if (!err && im.height() !== 0 && im.width() !== 0) {
                    if (counter % threshold === 0) {
                        let imageFileName = './uploads/saved-image-' + counter_img.toString() + '.png';

                        im.save(imageFileName);

                        fs.readFile(imageFileName, function(err, data) {
                            if (err) throw err;
                            typeof data;
                            /**
                             * Call API Custom here
                             */
                            callAPI(data, function(answer) {
                                let response = apiController(answer);
                                result += response + '\n';
                            });
                        });
                        counter_img++;
                    }

                    counter++;
                    iter();
                } else {
                    console.log('End of the video: ' + err);
                    video.release();
                    im.release();
                }
            });
        };

        iter();

        /*        blobService.createContainerIfNotExists('klepierre', {'publicAccessLevel': 'blob'}, function(error) {
         if (!error) {
         blobService.createBlockBlobFromLocalFile('klepierre', file.name, filelocalPath(), function(error, result, response) {
         if (!error) {
         console.log('file uploaded!');
         } else {
         console.log('Error during the upload: ' + error);
         }
         });
         } else {
         console.log('Error during the creation of the container: ' + error);
         }
         });*/
        setTimeout(myFunc, 10000, 'funky');
        function myFunc() {
            res.send(result);
        }
    });

    form.parse(req);

});

/**********************************
 * call API functions
 **********************************/

let predictionKey = '1b7ddc249aaf4f7f8a2245da0c7e9f13';
let projectId = '2d33e818-b923-43d2-b12c-b56d2e0e0dcf';

function callAPI(image, callback) {

    let options = {
        hostname: 'southcentralus.api.cognitive.microsoft.com',
        port: 443,
        path: '/customvision/v1.0/Prediction/' + projectId + '/image',
        method: 'POST',
        headers: {
            'Content-Type': 'multipart/form-data',
            'Prediction-key': predictionKey,
        },
    };

    let req = https.request(options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            console.log(`BODY: ${chunk}`);
            callback(chunk);
        });
        res.on('error', () => {
            console.log('Could not get the result');
        });
        res.on('end', () => {
            console.log('No more data in response.');
        });
    });

    req.write(image);
    req.end();
}

app.post('/download', function(req, res) {
    var names = req.body.name;

    res.json({ok: true});

    const fileDown = path.join(__dirname, '/downloads/');
    blobService.getBlobToLocalFile('mycontainer', names, fileDown + '\\' + names, function(error, result, response) {
        if (!error) {
            // blob retrieved
        }
    });
    console.log('valide');

});

app.get('/list', function(req, res) {
    blobService.listBlobsSegmented('mycontainer', null, function(err, result) {
        if (err) {
            console.log('Couldn\'t list blobs for container ');
            console.error(err);
        } else {
            console.log('Successfully listed blobs for container');
        }
        var names = [];
        names.toString();
        for (var i = 0; i < result.entries.length; i++) {

            names.push(result.entries[i].name);
        }
        res.send(names);
    });
});

app.listen(3000, function() {
    console.log('Server listening on port 3000');
});