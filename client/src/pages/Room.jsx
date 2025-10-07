import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { socket } from "../utils/socket";
import {
  initializeStream,
} from "../utils/mediaHandler";
import {
  createPeerConnection,
  handleOffer,
  handleAnswer,
  handleIceCandidate,
} from "../utils/webrtcHandler";
import { toast } from "react-toastify";

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [user] = useState(JSON.parse(localStorage.getItem("user")));
  const localVideoRef = useRef();
  const remoteVideoRefs = useRef({});
  const peerConnections = useRef({});

  console.log("Current user:", user);

  useEffect(() => {
    if (!user) {
      toast.error("Vui lòng đăng nhập!");
      navigate("/");
      return;
    }

    socket.emit("join-room", roomId, { username: user.username });

    initializeStream(localVideoRef, peerConnections, navigate);

    socket.on("all-users", (otherUsers) => {
      setUsers(otherUsers);
      otherUsers.forEach(({ socketId }) => {
        if (!peerConnections.current[socketId]) {
          createPeerConnection(socketId, roomId, peerConnections, localVideoRef, setupStream);
        }
      });
    });

    socket.on("offer", (data) => handleOffer(data, peerConnections, localVideoRef, setupStream));
    socket.on("answer", (data) => handleAnswer(data, peerConnections));
    socket.on("ice-candidate", (data) => handleIceCandidate(data, peerConnections));

    return () => {
      Object.values(peerConnections.current).forEach((pc) => pc.close());
      socket.off("all-users");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
    };
  }, [user, roomId]);

  const setupStream = (socketId, stream) => {
    if (!remoteVideoRefs.current[socketId]) {
      remoteVideoRefs.current[socketId] = React.createRef();
    }
    const videoElement = remoteVideoRefs.current[socketId].current;
    if (videoElement) videoElement.srcObject = stream;
  };

  return (
    <div>
      <h2>Phòng: {roomId}</h2>
      <video ref={localVideoRef} autoPlay muted width="300" />
      <div>
        {users.map(({ socketId, username }) => (
          <div key={socketId}>
            <video ref={remoteVideoRefs.current[socketId]} autoPlay width="300" />
            <p>{username}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
