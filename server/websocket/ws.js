const getGameData = require("./getGameData");
const handleMove = require("./handleMove");
const matchMaking = require("./matchMaking");

const queue = [];

const ws = (io, socket) => {
  console.log(`User joined with: ${socket.id}`);

  //------------Join room------------//
  socket.on("joinRoom", (data) => {
    const { roomId } = data;
    socket.join(roomId);
  });

  //------------Match Making------------//
  socket.on("findGame", (data) => matchMaking(io, queue, data));

  //------------Get game data------------//
  socket.on("getGameData", (data) => getGameData(io, socket, data));

  //------------Move------------//
  socket.on("move", (data) => handleMove(socket, data));

  //------------Resign------------//
  socket.on('resign', ({ roomId }) => {
    // Emit event to the opponent
    socket.to(roomId).emit('opponentResigned');
  });

  //------------Send Message------------//
  socket.on('sendMessage', ({ roomId, message }) => {
    console.log('Message received on server:', message);
    // Emit the message to all clients in the room except the sender
    socket.to(roomId).emit('msg-recieve', message);
  });

  //------------Draw------------//
  socket.on('draw', ({ roomId, userId }) => {
    // Emit event to the opponent to ask for draw confirmation
    socket.to(roomId).emit('drawRequest', { userId });
  });
  
  socket.on('confirmDraw', ({ roomId, userId, accept }) => {
    if (accept) {
      // If draw is accepted, notify both players
      socket.to(roomId).emit('drawOccurred');
    } else {
      // If draw is rejected, notify the requesting player
      socket.to(roomId).emit('drawRejected');
    }
  });
};

module.exports = ws;
