'use strict';

///////////////////////////////
// Step 1: Get the webcam video
///////////////////////////////

var video = document.querySelector('video');

var constraints = {
  audio: false,
  video: true
};

navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    window.stream = stream; // stream available to console
    if (window.URL) {
      video.src = window.URL.createObjectURL(stream);
    } else {
      video.src = stream;
    }
}, (err) => {
    console.log('navigator.getUserMedia error: ', error);    
})