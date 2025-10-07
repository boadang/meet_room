import { toast } from "react-toastify";

export const initializeStream = async (localVideoRef, peerConnections, navigate) => {
  try {
    console.log("[Media] Requesting media devices");
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    console.log("[Media] Got stream, assigning to localVideoRef");
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    console.log("[Media] Adding tracks to existing peer connections");
    Object.values(peerConnections.current).forEach((pc, index) => {
      console.log(`[Media] Adding tracks to PC ${index}`);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    });

    return stream;
  } catch (err) {
    console.error("[Media] Error accessing media devices:", err);
    toast.error("Failed to access camera/microphone");
    if (navigate) navigate("/"); // chỉ gọi nếu navigate được truyền vào
  }
};
