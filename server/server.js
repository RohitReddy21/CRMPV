import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import leadsRoutes from './routes/leadsRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import reportsRoutes from './routes/reportsRoutes.js';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

dotenv.config();

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

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*', // Adjust as needed for production
    methods: ['GET', 'POST']
  }
});

// Track connected users
const connectedUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  // Listen for user identification
  socket.on('identify', (userId) => {
    connectedUsers.set(userId, socket.id);
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
