const socket = io(); 
const localVideo = document.getElementById("localVideo");
const remoteVideos = document.getElementById("remoteVideos");

let localStream;
let peers = {}; // store peers by socketId

// ✅ Get local video/audio
navigator.mediaDevices
  .getUserMedia({ video: true, audio: true })
  .then((stream) => {
    localStream = stream;
    localVideo.srcObject = stream;
    localVideo.muted = true; // mute your own mic locally
    setupControls();
  });

// ✅ Join room
if (window.location.pathname !== "/") {
  const roomId = window.location.pathname.split("/").pop();
  socket.emit("join-room", roomId);
} else {
  const roomId = Math.random().toString(36).substring(2, 8);
  socket.emit("join-room", roomId);
}

// ✅ Function to create peer
function createPeer(socketId, initiator) {
  const peer = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  // Send ICE candidates
  peer.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", {
        target: socketId,
        candidate: event.candidate,
      });
    }
  };

  // Handle remote streams
  peer.ontrack = (event) => {
    let remoteVideo = document.getElementById(socketId);
    if (!remoteVideo) {
      remoteVideo = document.createElement("video");
      remoteVideo.id = socketId;
      remoteVideo.autoplay = true;
      remoteVideo.playsInline = true;
      remoteVideos.appendChild(remoteVideo);
    }
    remoteVideo.srcObject = event.streams[0];
  };

  // If we are the initiator, create an offer
  if (initiator) {
    peer.onnegotiationneeded = async () => {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket.emit("offer", {
        target: socketId,
        sdp: peer.localDescription,
      });
    };
  }

  return peer;
}

// ✅ Handle existing users when we join
socket.on("existing-users", (users) => {
  const waitForStream = setInterval(() => {
    if (localStream) {
      clearInterval(waitForStream);
      users.forEach((userId) => {
        const peer = createPeer(userId, true);
        peers[userId] = peer;
        localStream.getTracks().forEach((track) =>
          peer.addTrack(track, localStream)
        );
      });
    }
  }, 100);
});

// ✅ Handle new users joining
socket.on("user-joined", (socketId) => {
  const waitForStream = setInterval(() => {
    if (localStream) {
      clearInterval(waitForStream);
      const peer = createPeer(socketId, false);
      peers[socketId] = peer;
      localStream.getTracks().forEach((track) =>
        peer.addTrack(track, localStream)
      );
    }
  }, 100);
});

socket.on("offer", async ({ sdp, from }) => {
  const peer = peers[from];
  if (peer) {
    await peer.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    socket.emit("answer", {
      target: from,
      sdp: peer.localDescription,
    });
  }
});

socket.on("answer", async ({ sdp, from }) => {
  await peers[from]?.setRemoteDescription(new RTCSessionDescription(sdp));
});

socket.on("ice-candidate", ({ candidate, from }) => {
  peers[from]?.addIceCandidate(new RTCIceCandidate(candidate));
});

function setupControls() {
  const toggleMicBtn = document.getElementById("toggleMic");
  const toggleCamBtn = document.getElementById("toggleCam");
  const leaveBtn = document.getElementById("leaveRoom");

  let micEnabled = true;
  let camEnabled = true;

  toggleMicBtn.onclick = () => {
    micEnabled = !micEnabled;
    localStream.getAudioTracks().forEach(track => track.enabled = micEnabled);
    toggleMicBtn.innerHTML = micEnabled
      ? '<i class="fa-solid fa-microphone"></i>'
      : '<i class="fa-solid fa-microphone-slash"></i>';
  };

  toggleCamBtn.onclick = () => {
    camEnabled = !camEnabled;
    localStream.getVideoTracks().forEach(track => track.enabled = camEnabled);
    toggleCamBtn.innerHTML = camEnabled
      ? '<i class="fa-solid fa-camera"></i>'
      : '<i class="fa-solid fa-camera-slash"></i>';
  };

  leaveBtn.onclick = () => {
    socket.disconnect();
    for (const id in peers) {
      peers[id].close();
      const video = document.getElementById(id);
      if (video) video.remove();
    }
    if (localStream) localStream.getTracks().forEach(track => track.stop());
    window.location.href = "/";
  };
}
