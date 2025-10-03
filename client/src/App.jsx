import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");
const pc = new RTCPeerConnection();

function App() {
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();

  useEffect(() => {
    // Khi có user khác join phòng
    socket.on("user-joined", async (userId) => {
      console.log("User joined:", userId);

      // Tạo offer gửi cho user khác
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("offer", { sdp: offer, roomId });
    });

    socket.on("offer", async (data) => {
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("answer", { sdp: answer, roomId });
    });

    socket.on("answer", async (data) => {
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
    });

    socket.on("ice-candidate", (data) => {
      pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    });

    // Khi có stream remote
    pc.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    // Gửi ICE
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { candidate: event.candidate, roomId });
      }
    };
  }, [roomId]);

  const joinRoom = async () => {
    if (roomId.trim() !== "") {
      setJoined(true);
      socket.emit("join-room", roomId);

      // Lấy camera & mic
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localVideoRef.current.srcObject = stream;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      {!joined ? (
        <div>
          <h2>Join a Room</h2>
          <input
            type="text"
            placeholder="Enter room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button onClick={joinRoom}>Join</button>
        </div>
      ) : (
        <div>
          <h2>Room: {roomId}</h2>
          <video ref={localVideoRef} autoPlay muted style={{ width: "300px" }} />
          <video ref={remoteVideoRef} autoPlay style={{ width: "300px" }} />
        </div>
      )}
    </div>
  );
}

export default App;
