import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import webhookRouter from './src/webhooks/clerk/route';
import { authMiddleware, authErrorHandler } from './src/middleware';
import paymentRoutes from './routes/stripe_payment';
import userRoute from './routes/user'

import http from 'http';
import WebSocket from 'ws';
import inviteRoute from './routes/invite'
import friendRoute from './routes/friend';
import feedRouter from './routes/feed';
import groupRoutes from './routes/group';
import subscriptionRouter from './routes/subscription';

import pushNotiRouter from './routes/push-tokens';  
import notificationsRouter from './routes/notifications';

dotenv.config();


const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;



// Basic middleware
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws: WebSocket) {
  console.log('Client connected');
  
  ws.on('message', function incoming(message: WebSocket.RawData, isBinary: boolean) {
    console.log(message.toString(), isBinary);
    
    // Broadcast the message to all clients
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
  });
  
  ws.on('close', function() {
    console.log('Client disconnected');
  });
});


server.listen(8080, () => {
  console.log('Websocket listening to port 8080');
});


// Mount webhook router
app.use('/', webhookRouter);

// app.use('/api/stripe-customer', customerRoutes);
app.use('/api/stripe-payment', paymentRoutes);
app.use('/api/user', userRoute)
app.use('/api/invite', inviteRoute)
app.use('/api/friend', friendRoute)
app.use('/api/feed', feedRouter);
app.use('/api/groupMember', groupRoutes)
app.use('/api/push-tokens', pushNotiRouter);
app.use('/api/notifications', notificationsRouter);

// Error handling (must be after all routes)
app.use(authErrorHandler);

// Static files if needed
app.use(express.static('public'));

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server is running on ${PORT}`);
  console.log(`✅ Server is running locally at: http://localhost:${PORT}`);
});