const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // FE React sẽ chạy ở cổng 3000
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
    socket.to(roomId).emit("user-joined", socket.id);
  });

  // Gửi offer
  socket.on("offer", (data) => {
    socket.to(data.roomId).emit("offer", { 
      sdp: data.sdp, 
      sender: socket.id 
    });
  });

  // Gửi answer
  socket.on("answer", (data) => {
    socket.to(data.roomId).emit("answer", { 
      sdp: data.sdp, 
      sender: socket.id 
    });
  });

  // Gửi ICE candidate
  socket.on("ice-candidate", (data) => {
    socket.to(data.roomId).emit("ice-candidate", { 
      candidate: data.candidate, 
      sender: socket.id 
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.send("🚀 Socket.io Server is running!");  
});

server.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});
