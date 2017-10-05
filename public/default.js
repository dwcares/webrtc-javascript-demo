'use strict';

const localVideo = document.querySelector('.localVideo');
const remoteVideo = document.querySelector('.remoteVideo');
const clientInfo = document.querySelector('.client.info');
const clientStatus = document.querySelector('.client.status');
const peerInfo = document.querySelector('.peer.info');
const peerStatus = document.querySelector('.peer.status');
const joinButton = document.querySelector('.joinButton');
const callButton = document.querySelector('.callButton');
const waitingText = document.querySelector('.waiting');

const partnerName = document.querySelector('.partnerInfo');

const loginPage = document.querySelector('.login');
const loginForm = document.querySelector('.loginForm');
const loginUserName = document.querySelector('.usernameInput');

var socket;
var recognizer;

var myId;
var myName;
var peerName;

var peerConnection = new RTCPeerConnection({
  'iceServers': [{
    'urls': 'turn:turnserver3dstreaming.centralus.cloudapp.azure.com:5349',
    'username': 'user',
    'credential': '3Dtoolkit072017',
    'credentialType': 'password'
  }],
  'iceTransportPolicy': 'relay',
  'optional': [
    { 'DtlsSrtpKeyAgreement': true }
  ]
});

show(loginForm);

callButton.addEventListener('click', (e) => {
  if (callButton.classList.contains('hangup')) {
    socket.emit('bye');
  }
});

loginForm.addEventListener('submit', e => {
  var username = loginUserName.value;

  if (username.length > 0) {
    initCamera(false, true);
    myName = username;
    initSocket();
  }
  e.preventDefault();
});

function sendOffer() {
  peerConnection.createOffer((sessionDescription) => {
    peerConnection.setLocalDescription(sessionDescription);
    socket.emit('offer', sessionDescription);

  }, (error) => {
    console.log('Create offer error: ' + error);
  });
}

function initCamera(useAudio, useVideo) {
  var constraints = {
    audio: useAudio,
    video: useVideo
  };

  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {

    window.localStream = stream;

    localVideo.onplay = (e) => show(localVideo);
    if (window.URL) {
      localVideo.src = window.URL.createObjectURL(stream);
    } else {
      localVideo.src = stream;
    }

    peerConnection.addStream(stream);

  }, (err) => {
    console.log('GetUserMedia error: ', error);
  })
}

function stopCamera() {
  hide(localVideo);
  localStream.getVideoTracks()[0].stop();
  localVideo.src = '';
}

function show(element) {
  element.style.visibility = 'visible';
  element.classList.remove('hidden')
}

function hide(element, defer) {
  return new Promise((res, rej) => {
    element.classList.add('hidden')

    setTimeout((e) => {
      element.style.visibility = 'hidden';
      res();
    }, defer);
  })
}


////////////////////////////////////
////// Peer Connection Handlers
////////////////////////////////////

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
        label: e.candidate.sdpMLineIndex,
        id: e.candidate.sdpMid,
        candidate: e.candidate.candidate
      });
  }
};


////////////////////////////////////
////// Socket.io handlers
////////////////////////////////////

function initSocket() {

  socket = io.connect();

  socket.emit('login', { name: myName });

  socket.on('connected', (clientId) => {
    console.log('Connected: ' + clientId);
    hide(loginForm, 250).then(() => hide(loginPage, 400));
    myId = clientId;
    clientInfo.innerText = clientId;

    clientStatus.classList.add('online');
    waitingText.classList.remove('hidden');
  });

  socket.on('new-client', (name, clientId) => {
    console.log('New client: ' + clientId + ' name: ' + name);

    peerName = name;
    partnerName.innerHTML = peerName;

    peerInfo.innerText = clientId;
    peerStatus.classList.add('online');
  });

  socket.on('ready', (roomId) => {
    console.log('Ready to go');

    // First person who joined initiates the call
    if (roomId.split('Room_')[1] == myId) {
      console.log('sending_offer');
      sendOffer();
    }
    callButton.disabled = false;
    show(callButton);
    waitingText.classList.add('hidden');
  });

  socket.on('offer', (offer) => {
    peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    peerConnection.createAnswer().then((sessionDescription) => {
      peerConnection.setLocalDescription(sessionDescription);


      callButton.classList.add('hangup');
      socket.emit('answer', sessionDescription);
    },
      (error) => {
        console.log('Answer Error:' + error);
      }
    );
  })

  socket.on('candidate', (candidate) => {
    var iceCandidate = new RTCIceCandidate({
      sdpMLineIndex: candidate.label,
      candidate: candidate.candidate
    });
    peerConnection.addIceCandidate(iceCandidate);
  });

  socket.on('answer', (answer) => {
    callButton.classList.add('hangup');
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  });

  socket.on('bye', () => {
   

    peerStatus.classList.remove('online');
    peerInfo.innerText = '';
    partnerName.innerText = '';
    socket.disconnect();
    socket = null;

    hide(callButton, 300).then(() => {
      callButton.classList.remove('hangup');
      callButton.disabled = true;
    });
    
    hide(localVideo, 500).then(() => {
      stopCamera();
      remoteVideo.src = '';        
      show(loginPage);
      show(loginForm);
    });

  });
}