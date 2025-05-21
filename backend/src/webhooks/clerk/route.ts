import express, { Request, Response } from 'express';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/clerk-sdk-node';
import { createUser } from '../../lib/user';
import dotenv from 'dotenv';
import { CreateUserInput } from '../../types/user'; 

dotenv.config();

const webhookRouter = express.Router();

//Get webhook secret
const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
if (!WEBHOOK_SECRET) {
  throw new Error('Please add CLERK_WEBHOOK_SECRET to .env or .env.local');
}

// Define the webhook endpoint to handle POST requests from Clerk
webhookRouter.post('/webhook', async (req: Request, res: Response) => {
    // Extract Svix headers needed to verify the webhook
  const svix_id = req.headers['svix-id'] as string;
  const svix_timestamp = req.headers['svix-timestamp'] as string;
  const svix_signature = req.headers['svix-signature'] as string;

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).send('Missing Svix headers');
  }

  // Convert the body to a string for signature verification
  const body = JSON.stringify(req.body);

  // Create a new Webhook instance using the secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;
  try {
    //verify webhook
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return res.status(400).send('Webhook verification failed');
  }

  const eventType = evt.type;

  // Handle the 'user.created' event from Clerk
  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data;

    if (!id || !email_addresses?.length) {
      return res.status(400).send('Missing required user data');
    }

    //format user data
    const userData: CreateUserInput = {
      clerkId: id,
      email: email_addresses[0].email_address,
      firstName: first_name || '',
      lastName: last_name || '',
    };

    try {
        //Save user data to db
      await createUser(userData);
      return res.status(200).send('User created successfully');
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).send('Failed to create user');
    }
  }

  return res.status(200).send('');
});

export default webhookRouter;