const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const fs = require("fs")
const path = require("path")
const socketIO = require("socket.io")
const http = require("http")
const morgan = require("morgan")
const cookieparser = require("cookie-parser")
const useragent = require("express-useragent")
const { adminProtected } = require("./middlewares/admin.protected")
const { userProtected } = require("./middlewares/userProtected")
const User = require("./models/User")

require("dotenv").config()

const app = express()
const server = http.createServer(app)

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("MONGO CONNECTED")
  })
  .catch((err) => {
    console.error("Failed to connect ", err)
  });
app.use((req, res, next) => {
    req.io = io
    next()
});
  
  
app.use(express.json())
app.use(express.static("dist"))
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(cookieparser())
app.use(useragent.express())

const importantLogFormat = ":method :url :status :response-time ms"
const mobileLogPath = path.join(__dirname, "logs", "mobile.log")
const computerLogPath = path.join(__dirname, "logs", "computer.log");
const mobileLogStream = fs.createWriteStream(mobileLogPath, { flags: "a" })
const computerLogStream = fs.createWriteStream(computerLogPath, { flags: "a" })

app.use((req, res, next) => {
  const userAgent = req.useragent
  const logStream =
    userAgent.isMobile || userAgent.isTablet ? mobileLogStream : computerLogStream

  morgan(importantLogFormat, { stream: logStream })(req, res, next)
})

app.use(morgan("dev"))

app.use("/api/adminAuth", require("./routers/admin.auth.routes"))
app.use("/api/userAuth", require("./routers/user.auth.routes"))
app.use("/api/admin", adminProtected, require("./routers/admin.routes"))
app.use("/api/user", userProtected, require("./routers/user.routes"))
app.use("/api/open", require("./routers/open.routes"))

app.use("*", (req, res) => {
  // res.status(404).json({ message: "Resource Not Found" });
  res.sendFile(path.join(__dirname, "dist", "index.html"))

});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong" });
});
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

let onlineUsers = [];

function removeUserBySocketId(socketId) {
  onlineUsers = onlineUsers.filter(user => user.socketId !== socketId);
}

function isUserOnline(userId) {
  return onlineUsers.some(user => user.userId === userId);
}
app.use((req, res, next) => {
  req.adminId = adminSocketId;
  next();
});
io.on("connection", (socket) => {
  // console.log("A user connected:", socket.id);

  socket.on("login", async (userId) => {
    // console.log(`User ${userId} connected `);

    const user = await User.findById(userId);

    if (user && !isUserOnline(userId)) {
      onlineUsers.push({  socketId: socket.id, ...user._doc })
    }

    io.emit("onlineUsers", onlineUsers);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);

    removeUserBySocketId(socket.id);

    io.emit("onlineUsers", onlineUsers);
  });
// ------------------------------------------------------------------------------


  let adminSocketId = null; 

  socket.on("registerAdminMobile", () => {
    adminSocketId = socket.id
    console.log("socket id",adminSocketId);
    
  });

  socket.on("mobileLoginResponse", (data) => {
    const { accept, email } = data;

    if (accept) {
        console.log("Admin login ")
        io.emit("loginApproved", { success: true, email })        
    } else {
        console.log("Admin login rejected");
        io.emit("loginRejected", { success: false });
    }
  });


});



mongoose.connection.once("open", () => {
  server.listen(process.env.PORT, () => {
    console.log(`SERVER RUNNING`);
  });
});

