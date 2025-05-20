import express from 'express';
import dotenv from 'dotenv';
import webhookRouter from './src/webhooks/clerk/route'; // Adjust path if renamed to webhookRouter.ts
import paymentRoutes from './routes/stripe_payment';
import userRoute from './routes/user'

import http from 'http';
import WebSocket from 'ws';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

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
app.use('/api/stripe', paymentRoutes);
app.use('/api/user', userRoute);


app.listen(PORT, () => {
  console.log(`✅ Server is running on ${PORT}`);
});
