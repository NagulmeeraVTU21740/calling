const socket = io();
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let peerConnection;
const config = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        localVideo.srcObject = stream;

        socket.emit('join', 'room1');

        socket.on('user-connected', async userId => {
            peerConnection = createPeerConnection(userId, stream);
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            socket.emit('signal', { to: userId, signal: offer });
        });

        socket.on('signal', async data => {
            if (!peerConnection) {
                peerConnection = createPeerConnection(data.from, stream);
            }

            if (data.signal.type === 'offer') {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                socket.emit('signal', { to: data.from, signal: answer });
            } else if (data.signal.type === 'answer') {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));
            } else if (data.signal.candidate) {
                await peerConnection.addIceCandidate(new RTCIceCandidate(data.signal));
            }
        });
    });

function createPeerConnection(userId, stream) {
    const pc = new RTCPeerConnection(config);

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('signal', { to: userId, signal: event.candidate });
        }
    };

    pc.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    return pc;
}
