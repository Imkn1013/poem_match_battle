const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
//const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://imkn1013.github.io"
  }
});

app.get('/', (req, res) => {
  res.send("Socket.IO server is running.");
});

io.on("connection", (socket) => {
  console.log("A client connected:", socket.id);
  
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server listening on port 3000');
});
