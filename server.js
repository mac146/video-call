const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const express = require("express");
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

app.get("/", (_req, res) => {
  res.redirect(`/${Math.random().toString(36).substring(2, 8)}`);
});

app.get("/:room", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "room.html"));
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);             // join the Socket.IO room
    socket.currentRoom = roomId;     // save the room for later use
    console.log(`${socket.id} joined room ${roomId}`);
  });

  socket.on("offer", (data) => {
    io.to(data.target).emit("offer", { sdp: data.sdp, from: socket.id });
  });

  socket.on("answer", (data) => {
    io.to(data.target).emit("answer", { sdp: data.sdp, from: socket.id });
  });

  socket.on("ice-candidate", (data) => {
    io.to(data.target).emit("ice-candidate", {
      candidate: data.candidate,
      from: socket.id,
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });

  socket.on("disconnecting", () => {
    if (socket.currentRoom) {
      socket.to(socket.currentRoom).emit("user-left", socket.id);
    }
  });

});




server.listen(3000, () => {
  console.log("Listening on port 3000");
});