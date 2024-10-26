const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const socketIO = require("socket.io");
const http = require("http");
const morgan = require("morgan");
const cookieparser = require("cookie-parser");
const useragent = require("express-useragent");
const { adminProtected } = require("./middlewares/admin.protected");
const { userProtected } = require("./middlewares/userProtected");
const User = require("./models/User");

require("dotenv").config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with server
const io = socketIO(server, {
  cors: {
    origin: "*",
    // credentials: true,
  },
});

// Mongoose connection
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("MONGO CONNECTED");
  })
  .catch((err) => {
    console.error("Failed to connect ", err);
  });

// Pass io to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieparser());
app.use(useragent.express());

const importantLogFormat = ":method :url :status :response-time ms";
const mobileLogPath = path.join(__dirname, "logs", "mobile.log");
const computerLogPath = path.join(__dirname, "logs", "computer.log");
const mobileLogStream = fs.createWriteStream(mobileLogPath, { flags: "a" });
const computerLogStream = fs.createWriteStream(computerLogPath, { flags: "a" });

// Log setup
app.use((req, res, next) => {
  const userAgent = req.useragent;
  const logStream =
    userAgent.isMobile || userAgent.isTablet ? mobileLogStream : computerLogStream;

  morgan(importantLogFormat, { stream: logStream })(req, res, next);
});
app.use(morgan("dev"));

// Define routes
app.use("/api/adminAuth", require("./routers/admin.auth.routes"));
app.use("/api/userAuth", require("./routers/user.auth.routes"));
app.use("/api/admin", adminProtected, require("./routers/admin.routes"));
app.use("/api/user", userProtected, require("./routers/user.routes"));
app.use("/api/open", require("./routers/open.routes"));

// Catch-all for undefined routes
app.use("*", (req, res) => {
  res.status(404).json({ message: "Resource Not Found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong" });
});

// Store admin socket IDs
const adminSocketIds = new Map();

// Socket connection handling
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Handle login event for users
  socket.on("login", async (userId) => {
    console.log(`User ${userId} connected`);

    const user = await User.findById(userId);
    if (user && !onlineUsers.some((u) => u.userId === userId)) {
      onlineUsers.push({ socketId: socket.id, ...user._doc });
    }

    io.emit("onlineUsers", onlineUsers);
  });

  // Register admin mobile socket
  socket.on("registerAdminMobile", (adminId) => {
    adminSocketIds.set(adminId, socket.id);
    console.log(`Admin ${adminId} registered with socket ID:`, socket.id);
  });

  // Handle admin login response
  socket.on("mobileLoginResponse", (data) => {
    const { accept, email } = data;

    if (accept) {
      console.log("Admin login approved");
      io.emit("loginApproved", { success: true, email });
    } else {
      console.log("Admin login rejected");
      io.emit("loginRejected", { success: false });
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);

    // Remove user from onlineUsers and adminSocketIds if applicable
    onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
    for (let [adminId, socketId] of adminSocketIds.entries()) {
      if (socketId === socket.id) {
        adminSocketIds.delete(adminId);
      }
    }

    io.emit("onlineUsers", onlineUsers);
  });
});

mongoose.connection.once("open", () => {
  server.listen(process.env.PORT, () => {
    console.log(`SERVER RUNNING`);
  });
});
