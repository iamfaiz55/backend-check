const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
  },
});

app.set("socketio", io); // Store io in app context for easy access

// Your other configurations and middleware...
require("dotenv").config();
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MONGO CONNECTED"))
  .catch((err) => console.error("Failed to connect ", err));

// Socket connection logic
io.on("connection", (socket) => {
  console.log("New socket connection:", socket.id);

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = io; // Export io for use in other files
