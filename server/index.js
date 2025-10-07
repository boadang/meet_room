const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth");

dotenv.config();

const app = express();
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err.message));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

// Store users in each room with their socket.id and username
const rooms = {}; // { roomId: [{ socketId, username }] }

io.on("connection", (socket) => {
  const logPrefix = `[${new Date().toISOString()} | ${socket.id} | ${socket.handshake.address}]`;
  console.log(`${logPrefix} 🟢 User connected`);

  socket.on("join-room", (roomId, userInfo) => {
    if (!roomId || !userInfo?.username) {
      console.error(`${logPrefix} ❌ Invalid join-room data: roomId=${roomId}, userInfo=${JSON.stringify(userInfo)}`);
      return socket.emit("error", { message: "Invalid room ID or username" });
    }

    socket.join(roomId);

    if (!rooms[roomId]) rooms[roomId] = [];
    if (!rooms[roomId].some((u) => u.socketId === socket.id)) {
      rooms[roomId].push({ socketId: socket.id, username: userInfo.username });
    }

    console.log(`${logPrefix} 👥 User ${userInfo.username} joined room ${roomId}`);
    console.log(`${logPrefix} 📋 Users in room ${roomId}: ${JSON.stringify(rooms[roomId], null, 2)}`);

    const otherUsers = rooms[roomId]
      .filter((u) => u.socketId !== socket.id)
      .map((u) => ({ socketId: u.socketId, username: u.username }));
    socket.emit("all-users", otherUsers);

    socket.to(roomId).emit("user-joined", { userId: socket.id, userInfo });
  });

  socket.on("offer", (data) => {
    if (!data.receiver || !data.sdp || !data.roomId) {
      console.error(`${logPrefix} ❌ Invalid offer data: ${JSON.stringify(data)}`);
      return socket.emit("error", { message: "Invalid offer data" });
    }
    console.log(`${logPrefix} 📤 Offer sent to ${data.receiver}`);
    io.to(data.receiver).emit("offer", {
      sdp: data.sdp,
      sender: socket.id,
    });
  });

  socket.on("answer", (data) => {
    if (!data.receiver || !data.sdp || !data.roomId) {
      console.error(`${logPrefix} ❌ Invalid answer data: ${JSON.stringify(data)}`);
      return socket.emit("error", { message: "Invalid answer data" });
    }
    console.log(`${logPrefix} 📥 Answer sent to ${data.receiver}`);
    io.to(data.receiver).emit("answer", {
      sdp: data.sdp,
      sender: socket.id,
    });
  });

  socket.on("ice-candidate", (data) => {
    if (!data.receiver || !data.candidate || !data.roomId) {
      console.error(`${logPrefix} ❌ Invalid ICE candidate data: ${JSON.stringify(data)}`);
      return socket.emit("error", { message: "Invalid ICE candidate data" });
    }
    console.log(`${logPrefix} ❄️ ICE candidate sent to ${data.receiver}`);
    io.to(data.receiver).emit("ice-candidate", {
      candidate: data.candidate,
      sender: socket.id,
    });
  });

  socket.on("disconnect", () => {
    console.log(`${logPrefix} 🔴 User disconnected`);
    for (const roomId in rooms) {
      const user = rooms[roomId].find((u) => u.socketId === socket.id);
      if (user) {
        rooms[roomId] = rooms[roomId].filter((u) => u.socketId !== socket.id);
        io.to(roomId).emit("user-left", { socketId: socket.id, username: user.username });
        console.log(`${logPrefix} 👋 User ${user.username} left room ${roomId}`);
        console.log(`${logPrefix} 📋 Remaining users in room ${roomId}: ${JSON.stringify(rooms[roomId], null, 2)}`);

        if (rooms[roomId].length === 0) {
          delete rooms[roomId];
          console.log(`${logPrefix} 🗑️ Room ${roomId} deleted as it's empty`);
        }
      }
    }
  });

  socket.on("error", (err) => {
    console.error(`${logPrefix} 🚨 Socket error: ${err.message}`);
  });
});

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT} | ${new Date().toISOString()}`);
});