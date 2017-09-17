'use strict';

var isInitiator;
var socket = io.connect();

var video = document.querySelector('.localVideo');
var remoteVideo = document.querySelector('.remoteVideo');

var joinButton = document.querySelector('.joinButton');
var callButton = document.querySelector('.callButton');

///////////////////////////////
// Step 1: Get the webcam video
///////////////////////////////

var constraints = {
  audio: false,
  video: true
};

navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
  window.localStream = stream; // stream available to console
  if (window.URL) {
    video.src = window.URL.createObjectURL(stream);
  } else {
    video.src = stream;
  }

  socket.emit('message', 'mediaReady');
  
  peerConnection.addStream(stream);

}, (err) => {
  console.log('navigator.getUserMedia error: ', error);
})

///////////////////////////////
// Step 2: Join a room
///////////////////////////////

joinButton.addEventListener('click', (e) => {
  var room = "David"
  socket.emit('join', room);
})

socket.on('created', (room, clientId) => {
  isInitiator = true;
  console.log('Created room: ' + room)
  
});

socket.on('joined', (room, clientId) => {
  console.log('Joined room: ' + room);

  isInitiator = false;
});



socket.on('full', (room) => {
  console.log('Room: ' + room + ' is full');
});


/////////////////////////////////////
// Step 3: Create a peer connection
/////////////////////////////////////

var servers = {}

var peerConnection = new RTCPeerConnection(servers);
console.log('Created local peer connection object');

peerConnection.onaddstream = () => {
  console.log('Remote stream added.');
  remoteVideo.src = window.URL.createObjectURL(event.stream);
  window.remoteStream = event.stream;
};

peerConnection.onremovestream = () => {
  console.log('Remote stream removed. Event: ', event);
};

peerConnection.onicecandidate = (e) => {
  console.log('onIceCandidate');

  if (e.candidate) {
    console.log('candidate: ' + e.candidate);

    socket.emit('candidate',
    {
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    });
  }
};


/////////////////////////////////////
// Step 4: Initiate the call
/////////////////////////////////////

callButton.addEventListener('click', (e) => {
  if (isInitiator) {
    peerConnection.createOffer((sessionDescription) => {
      peerConnection.setLocalDescription(sessionDescription);
  
      socket.emit('offer', sessionDescription);
  
    }, (error) => {
      console.log('Create offer error: ' + error);
  
    });
  }
})

socket.on('offer', (offer) => {

  peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  
  //answer
  peerConnection.createAnswer().then((sessionDescription) => {
      peerConnection.setLocalDescription(sessionDescription);
      socket.emit('answer', sessionDescription);
    },
    (error) => {
      console.log('Answer Error:'+ error);
    }
  );

})

socket.on('candidate', (candidate) => {
  var iceCandidate = new RTCIceCandidate({
    sdpMLineIndex: candidate.label,
    candidate: candidate.candidate
  });
  peerConnection.addIceCandidate(iceCandidate);
})

/////////////////////////////////////
// Step 4: Answer the call
/////////////////////////////////////

socket.on('answer', (answer) => {
  peerConnection.setRemoteDescription(new RTCSessionDescription(answer));  
})


