  
const ENCRYPTION_KEY = process.env.MESSAGE_SECRET_KEY || '12345678901234567890123456789012'; // 32 bytes for aes-256
const IV_LENGTH = 16; // AES block size

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = textParts.join(':');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
import crypto from 'crypto';
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import leadsRoutes from './routes/leadsRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import reportsRoutes from './routes/reportsRoutes.js';
import chatRoutes from './routes/Chat.js';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import Message from './models/Message.js';
import Group from './models/Group.js';
import path from 'path';

// Load environment variables
dotenv.config();
console.log('✅ KEY LENGTH:', process.env.MESSAGE_SECRET_KEY.length); // should log 32

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
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const connectedUsers = new Map();

io.on('connection', (socket) => {
  socket.on('identify', (userId) => {
    connectedUsers.set(userId, socket.id);
    socket.join(userId);
  });

  socket.on('chatMessage', async ({ sender, receiver, content, isGroup }) => {
    try {
      let message;
      if (isGroup) {
        // Encrypt content before saving
        const encryptedContent = encrypt(content);
        message = new Message({ sender, receiver, content: encryptedContent, receiverModel: 'Group' });
        await message.save();
        let savedMsg = await Message.findById(message._id).lean();
        // Decrypt before sending to client
        savedMsg.content = decrypt(savedMsg.content);
        console.log('📨 Saved group message:', savedMsg);
        const group = await Group.findById(receiver);
        if (group?.members) {
          group.members.forEach(memberId => {
            io.to(String(memberId)).emit('chatMessage', savedMsg);
          });
        }
        socket.emit('chatMessage', savedMsg);
      } else {
        // Encrypt content before saving
        const encryptedContent = encrypt(content);
        message = new Message({ sender, receiver, content: encryptedContent, receiverModel: 'User' });
        await message.save();
        let savedMsg = await Message.findById(message._id).lean();
        // Decrypt before sending to client
        savedMsg.content = decrypt(savedMsg.content);
        console.log('📨 Saved user message:', savedMsg);
        io.to(receiver).emit('chatMessage', savedMsg);
        socket.emit('chatMessage', savedMsg);
      }
    } catch (err) {
      console.error('❌ Message send failed:', err);
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
// ----------------- Deployment -----------------
app.use(express.static(path.join(__dirname, '../frontend/build')));

// All other GET requests not handled before will return the frontend index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

const PORT = process.env.PORT || 5001;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
  });
