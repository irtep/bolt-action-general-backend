import https from 'https';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import armiesRoutes from './routes/armies';

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const app = express();
const PORT = process.env.PORT || 5509;

// Middleware
app.use(cors({
  origin: [/^https?:\/\/localhost(:\d+)?$/, /^https?:\/\/193\.28\.89\.151:5509$/] // both http and https for my ip and all localhosts
}));


app.use(helmet());
app.use(express.json());

// Serve static files (your React build)
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/armies', armiesRoutes);

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

https.createServer(options, app).listen(PORT, () => {
  console.log('version 1.1.0');
  console.log(`HTTPS server running on https://193.28.89.151:${PORT}`);
});
