
require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const app = express()
const http = require('http').Server(app)
const port = process.env.PORT
const User = require('./models/userModel')
const Chat = require('./models/chatModel')
//mongoose.connect('mongodb://127.0.0.1:27017/chat-app')
try {
  mongoose.connect(process.env.MONGO_URL);
} catch (error) {
  handleError(error);
}

const userRoute = require('./routes/userRoute')
app.use('/', userRoute)

const io = require('socket.io')(http)

const usp = io.of('/user-namespace')

usp.on('connection', async function (socket) {
  console.log('user-connected')
  let userId = socket.handshake.auth.token
  await User.findByIdAndUpdate({ _id: userId }, { $set: { is_online: '1' } });

  socket.broadcast.emit('getOnlineUser', { user_id: userId })
  socket.on('disconnect', async function () {
    console.log('user dis');
    let userId = socket.handshake.auth.token
    await User.findByIdAndUpdate({ _id: userId }, { $set: { is_online: '0' } });

    socket.broadcast.emit('getOfflineUser', { user_id: userId })
  })


  socket.on('newChat', function (data) {
    socket.broadcast.emit('loadNewChat', data);
  })

  // load old chats

  socket.on('existsChat', async function (data) {
    let chat = await Chat.find({
      $or: [
        { sender_id: data.sender_id, receiver_id: data.receiver_id },
        { sender_id: data.receiver_id, receiver_id: data.sender_id },
      ]
    })

    socket.emit('loadChats', { chats: chat });

  })

  socket.on('chatDeleted', function (id) {
    socket.broadcast.emit('chatMessageDeleted', id);
  })

  socket.on('chatUpdated', function (data) {
    socket.broadcast.emit('chatMessageUpdated', data);
  })

  socket.on('newGroupChat', function (data) {
    socket.broadcast.emit('loadNewGroupChat', data);
  })

})


http.listen(port, () => {
  console.log(`App listening on port ${port}`)
})