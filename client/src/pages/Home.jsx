import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../utils/socket";
import { toast } from "react-toastify";

const Home = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");

  // ✅ Lấy thông tin user đã login
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser?.username) {
      setUsername(storedUser.username);
    } else {
      toast.error("Vui lòng đăng nhập trước khi vào trang Home!");
      navigate("/"); // quay lại trang đăng nhập
    }
  }, [navigate]);

  // ✅ Xử lý khi tham gia phòng
  const handleJoin = () => {
    if (!roomId.trim()) {
      toast.error("Vui lòng nhập ID phòng!");
      return;
    }

    // Gửi thông tin lên server qua socket
    socket.emit("join-room", { roomId, username });

    // Chuyển sang trang phòng
    navigate(`/room/${roomId}`);
  };

  // ✅ Đăng xuất
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    toast.info("Đã đăng xuất!");
    navigate("/");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white px-4">
      <h1 className="text-4xl font-bold mb-6 text-blue-400">🎥 WebRTC Meet</h1>

      <div className="bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-sm text-center">
        <h2 className="text-xl mb-4">Xin chào, <span className="text-blue-300">{username}</span> 👋</h2>

        <input
          className="p-2 mb-4 w-full rounded text-black"
          type="text"
          placeholder="Nhập ID phòng..."
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />

        <button
          onClick={handleJoin}
          className="bg-blue-600 hover:bg-blue-700 transition-colors w-full py-2 rounded mb-3 font-medium"
        >
          Tham gia phòng
        </button>

        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 transition-colors w-full py-2 rounded font-medium"
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
};

export default Home;
