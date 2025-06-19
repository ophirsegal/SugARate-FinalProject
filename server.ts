import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { ImageUtils } from './utils/imageUtils';

// Import routes
import authRoutes from './routes/auth';
import postsRoutes from './routes/posts';
import messageRoutes, { setupSocketHandlers } from './routes/messages';
import userRoutes from './routes/users';
import aiChatRoutes from './routes/aiChat';
import foodImageRoutes from './routes/foodImageAI';
import googleAuthRouter from './routes/googleAuth';
import feedbackRoutes from './routes/feedback';

// Swagger imports
import swaggerUI from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerOptions from './swaggerOptions';

dotenv.config();

// Check required environment variables
const requiredEnvVars = {
  'MongoDB URI': process.env.MONGODB_URI,
  'Port': process.env.PORT,
  'Google Client ID': process.env.GOOGLE_CLIENT_ID,
  'Google Client Secret': process.env.GOOGLE_CLIENT_SECRET,
  'Google Redirect URI': process.env.GOOGLE_REDIRECT_URI,
  'Session Secret': process.env.SESSION_SECRET
};

console.log('\nChecking environment variables:');
let missingVars = false;
for (const [name, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    console.error(`❌ Missing ${name}`);
    missingVars = true;
  } else {
    console.log(`✓ ${name} is set`);
  }
}

if (missingVars) {
  throw new Error('Missing required environment variables. Check console for details.');
}
//socket ai
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    credentials: true,
    methods: ["GET", "POST"]
  }
});

// Initialize image upload directory
ImageUtils.initialize()
  .then(() => {
    console.log('✓ Image upload directory initialized');
  })
  .catch(error => {
    console.error('❌ Failed to initialize image upload directory:', error);
  });

// Session middleware (add this before other middleware)
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Other middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));
// Swagger Setup
const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiChatRoutes);
app.use('/api/ai', foodImageRoutes);
app.use('/api/auth/google', googleAuthRouter);
app.use('/api/feedback', feedbackRoutes);

// Setup socket handlers
setupSocketHandlers(io);

// Database connection
mongoose.connect(process.env.MONGODB_URI!)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Upload directory accessible at http://localhost:${PORT}/uploads`);
});