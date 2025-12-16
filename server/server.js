import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import leadsRoutes from './routes/leadsRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import reportsRoutes from './routes/reportsRoutes.js';
import chatRoutes from './routes/chatmsg.js'
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import Message from './models/Message.js';
import crypto from 'crypto';
import Group from './models/Group.js';

// Load environment variables
dotenv.config();
// console.log('✅ KEY LENGTH:', process.env.MESSAGE_SECRET_KEY.length); // should log 32

// ✅ Use 32-byte key (AES-256-CBC)


const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('✅ CRM Server is Running');
});

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/chat', chatRoutes);

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*', // Adjust as needed for production
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Track connected users
const connectedUsers = new Map(); // userId -> socketId

const ENCRYPTION_KEY = process.env.MESSAGE_SECRET_KEY;
const IV_LENGTH = 16; // AES block size

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

io.on('connection', (socket) => {
  // Listen for user identification
  socket.on('identify', (userId) => {
    connectedUsers.set(userId, socket.id);
    socket.join(userId); // Join a room for the user
  });
   // Listen for chat messages
socket.on('chatMessage', async ({ sender, receiver, content, isGroup }) => {
    try {
      // Encrypt message content before saving
      const encryptedContent = encrypt(content);
      const receiverModel = isGroup ? 'Group' : 'User';
      const message = new Message({ sender, receiver, content: encryptedContent, receiverModel });
      await message.save();

      // Emit decrypted message to receiver and sender
      const safeMessage = {
        ...message.toObject(),
        content: decrypt(message.content)
      };
      io.to(receiver).emit('chatMessage', safeMessage);
      socket.emit('chatMessage', safeMessage);
    } catch (err) {
      console.error('Error saving chat message:', err);
      socket.emit('error', 'Message send failed');
    }
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        break;
      }
    }
  });
});

app.set('io', io);
app.set('connectedUsers', connectedUsers);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
  });
