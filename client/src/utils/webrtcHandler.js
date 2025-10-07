// src/utils/webrtcHandler.js
import { toast } from "react-toastify";
import { socket } from "./socket";

const pcConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

// Các đối tượng quản lý WebRTC
const peerConnections = {};
const remoteVideoRefs = {};

export const initializeStream = async (localVideoRef, peerConnectionsRef, navigate) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideoRef.current.srcObject = stream;

    // Gắn track vào từng peer đã có
    Object.values(peerConnectionsRef.current).forEach((pc) => {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    });

    return stream;
  } catch (err) {
    console.error("[Media] Error:", err);
    toast.error("Không thể truy cập camera/mic");
    navigate("/");
  }
};

// Tạo kết nối Peer cho user mới
export const createPeerConnection = (socketId, localStream, roomId, setupPeerConnection) => {
  const pc = new RTCPeerConnection(pcConfig);
  pc.remoteSocketId = socketId;
  peerConnections[socketId] = pc;

  setupPeerConnection(socketId, pc);

  if (localStream) {
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
  }

  return pc;
};

export const handleOffer = async ({ sdp, sender, roomId, localStream, setupPeerConnection }) => {
  let pc = peerConnections[sender];
  if (!pc) {
    pc = createPeerConnection(sender, localStream, roomId, setupPeerConnection);
  }
  await pc.setRemoteDescription(new RTCSessionDescription(sdp));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  socket.emit("answer", { sdp: answer, receiver: sender, roomId });
};

export const handleAnswer = async ({ sdp, sender }) => {
  const pc = peerConnections[sender];
  if (!pc) return;
  await pc.setRemoteDescription(new RTCSessionDescription(sdp));
};

export const handleIceCandidate = ({ candidate, sender }) => {
  const pc = peerConnections[sender];
  if (pc && candidate) {
    pc.addIceCandidate(new RTCIceCandidate(candidate)).catch((err) =>
      console.error("[ICE] Error adding candidate:", err)
    );
  }
};
