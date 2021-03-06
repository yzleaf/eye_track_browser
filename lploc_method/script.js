const TIME_DELAY = 3000; // 3s
const PUPIL_FOCUS = 0;
const PUPIL_OUT = 1;

var initialized = false;

let last_flag = null
let curr_flag = null;
let start_time = Number.POSITIVE_INFINITY;

let positionLeft = document.getElementById('positionLeft')
let positionRight = document.getElementById('positionRight')

function button_callback() {

    /* 0. check whether we're already running detection process    */
    if(initialized)
        return; // if yes, then do not initialize everything again


    /* 1. initialize the face detector - pico.js    */
    var update_memory = pico.instantiate_detection_memory(5); // we will use the detecions of the last 5 frames
    var facefinder_classify_region = function(r, c, s, pixels, ldim) {return -1.0;};

    // official file can be find through the website
    // var cascadeurl = 'https://raw.githubusercontent.com/nenadmarkus/pico/c2e81f9d23cc11d1a612fd21e4f9de0921a5d0d9/rnt/cascades/facefinder';
    var cascadeurl = './pupiljs/facefinder';
    fetch(cascadeurl).then(function(response) {
        response.arrayBuffer().then(function(buffer) {
            var bytes = new Int8Array(buffer);
            facefinder_classify_region = pico.unpack_cascade(bytes);
            console.log('* facefinder loaded');
        })
    })


    /* 2. initialize the pupil localizer - lploc.js    */
    var do_puploc = function(r, c, s, nperturbs, pixels, nrows, ncols, ldim) {return [-1.0, -1.0];};

    // var puplocurl = 'https://drone.nenadmarkus.com/data/blog-stuff/puploc.bin';
    var puplocurl = './pupiljs/puploc.bin';
    fetch(puplocurl).then(function(response) {
        response.arrayBuffer().then(function(buffer) {
            var bytes = new Int8Array(buffer);
            do_puploc = lploc.unpack_localizer(bytes);
            console.log('* puploc loaded');
        })
    })


    /* 3. get the drawing context on the canvas and define a function to transform an RGBA image to grayscale    */
    var ctx = document.getElementsByTagName('canvas')[0].getContext('2d');
    function rgba_to_grayscale(rgba, nrows, ncols) {
        var gray = new Uint8Array(nrows*ncols);
        for(var r=0; r<nrows; ++r)
            for(var c=0; c<ncols; ++c)
                // gray = 0.2*red + 0.7*green + 0.1*blue
                gray[r*ncols + c] = (2*rgba[r*4*ncols+4*c+0]+7*rgba[r*4*ncols+4*c+1]+1*rgba[r*4*ncols+4*c+2])/10;
        return gray;
    }


    /* 4. this function is called each time a video frame becomes available    */
    var processfn = function(video, dt) {

        // eyes don't lookat the screen && it last for a period of time
        if (curr_flag == PUPIL_OUT && start_time + TIME_DELAY < new Date().getTime()) {
            start_time = Number.POSITIVE_INFINITY; // restore to a initial value
            alert("Attention!"); // this alert may change to a return value flag which indicate potential cheating behavior          
        }

        // render the video frame to the canvas element and extract RGBA pixel data
        ctx.drawImage(video, 0, 0);
        var rgba = ctx.getImageData(0, 0, 640, 480).data;
        // prepare input to `run_cascade`
        image = {
            "pixels": rgba_to_grayscale(rgba, 480, 640),
            "nrows": 480,
            "ncols": 640,
            "ldim": 640
        }
        params = {
            "shiftfactor": 0.1, // move the detection window by 10% of its size
            "minsize": 100,     // minimum size of a face
            "maxsize": 1000,    // maximum size of a face
            "scalefactor": 1.1  // for multiscale processing: resize the detection window by 10% when moving to the higher scale
        }
        // run the cascade over the frame and cluster the obtained detections
        // dets is an array that contains (r, c, s, q) quadruplets
        // (representing row, column, scale and detection score)
        dets = pico.run_cascade(image, facefinder_classify_region, params);
        dets = update_memory(dets);
        dets = pico.cluster_detections(dets, 0.2); // set IoU threshold to 0.2
        
        // console.log(dets.length);

        // draw detections
        for(i=0; i<dets.length; ++i)
            // check the detection score
            // if it's above the threshold, draw it
            // (the constant 50.0 is empirical: other cascades might require a different one)
            if(dets[i][3]>50.0)
            {
                // detect pupil focus, set the flag
                last_flag = curr_flag;
                curr_flag = PUPIL_FOCUS;

                var r, c, s;
                
                ctx.beginPath();
                ctx.arc(dets[i][1], dets[i][0], dets[i][2]/2, 0, 2*Math.PI, false);
                ctx.lineWidth = 3;
                ctx.strokeStyle = 'red';
                ctx.stroke();
                //
                // find the eye pupils for each detected face
                // starting regions for localization are initialized based on the face bounding box
                // (parameters are set empirically)

                // first eye
                r = dets[i][0] - 0.075*dets[i][2];
                c = dets[i][1] - 0.175*dets[i][2];
                s = 0.35*dets[i][2];
                [r, c] = do_puploc(r, c, s, 63, image)
                
                // display
                positionLeft.innerHTML = "First:  x  " + c + "  y  " + r

                if(r>=0 && c>=0)
                {
                    ctx.beginPath();
                    ctx.arc(c, r, 1, 0, 2*Math.PI, false);
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = 'red';
                    ctx.stroke();
                }

                // second eye
                r = dets[i][0] - 0.075*dets[i][2];
                c = dets[i][1] + 0.175*dets[i][2];
                s = 0.35*dets[i][2];
                [r, c] = do_puploc(r, c, s, 63, image)
                
                // display
                positionRight.innerHTML = "Second:  x  " + c + "  y  " + r

                if(r>=0 && c>=0)
                {
                    ctx.beginPath();
                    ctx.arc(c, r, 1, 0, 2*Math.PI, false);
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = 'red';
                    ctx.stroke();                   
                }
            }
            else { // not detect (assume not look at screen)
                last_flag = curr_flag;
                curr_flag = PUPIL_OUT;

                // only last time look at the screen, current time not look at the screen, do we record the not focus starting time
                if (last_flag == PUPIL_FOCUS) {
                    start_time = new Date().getTime();
                    // console.log(start_time)
                }
                
            }

    }

    
    /* 5. instantiate camera handling (see https://github.com/cbrandolino/camvas)    */
    var mycamvas = new camvas(ctx, processfn);


    initialized = true;
}