import dotenv from 'dotenv';
import Stripe from 'stripe';

// Load environment variables from .env file
dotenv.config();

// Check if the API key is present
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in the environment variables');
}

// Initialize Stripe with TypeScript typing
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Interface for CardDetails return type
interface CardDetailsResponse {
  id: string;
  last4: string;
  brand: string;
  expMonth: number;
  expYear: number;
  number?: string;
  cvc?: string;
  status: string;
}

// Function to create a cardholder
async function createCardholder(): Promise<string> {
  try {
    const cardholder = await stripe.issuing.cardholders.create({
      name: 'Test User',
      email: 'test.user@example.com',
      phone_number: '+14155555555',
      status: 'active',
      type: 'individual',
      billing: {
        address: {
          line1: '123 Test Street',
          city: 'San Francisco',
          state: 'CA',
          postal_code: '94111',
          country: 'US',
        },
      },
      individual: {
        card_issuing: {
          user_terms_acceptance: {
            date: Math.floor(Date.now() / 1000), // Current timestamp in seconds
            ip: '127.0.0.1', // Client IP address where terms were accepted
        }   },
        dob: { // cardholder must be at least 13 years old
          "day": 26,
          "month": 2,
          "year": 2004
      },
      first_name: "Test",
      last_name: "User",
      }
    });
    
    console.log('Cardholder created successfully:');
    console.log(cardholder);

    return cardholder.id;
  } catch (error) {
    console.error('Error creating cardholder:', error);
    throw error;
  }
}

// Function to create a virtual card
async function createVirtualCard(cardholderId: string): Promise<string> {
  try {
    const card = await stripe.issuing.cards.create({
      cardholder: cardholderId,
      currency: 'usd',
      type: 'virtual',
      status: 'active',
      spending_controls: {
        spending_limits: [
          {
            amount: 5000, // $50.00
            interval: 'daily',
          },
        ],
        allowed_categories: [],
        blocked_categories: [],
      },
    });
    
    console.log('Virtual card created successfully:');
    console.log(card);
    return card.id;
  } catch (error) {
    console.error('Error creating virtual card:', error);
    throw error;
  }
}

// Function to retrieve card details
async function getCardDetails(cardId: string): Promise<CardDetailsResponse> {
  try {
    const cardDetails = await stripe.issuing.cards.retrieve(
      cardId,
      { expand: ['number', 'cvc'] }
    );
    
    const formattedDetails: CardDetailsResponse = {
      id: cardDetails.id,
      last4: cardDetails.last4,
      brand: cardDetails.brand,
      expMonth: cardDetails.exp_month,
      expYear: cardDetails.exp_year,
      number: cardDetails.number as string | undefined,
      cvc: cardDetails.cvc as string | undefined,
      status: cardDetails.status
    };
    
    console.log('Card details retrieved successfully:');
    console.log(formattedDetails);
    
    return formattedDetails;
  } catch (error) {
    console.error('Error retrieving card details:', error);
    throw error;
  }
}

// Main function to run the test
async function testStripeVirtualCard(): Promise<void> {
  try {
    console.log('Starting Stripe Virtual Card Test...');
    
    // Step 1: Create a cardholder
    console.log('\n--- Step 1: Creating a cardholder ---');
    const cardholderId = await createCardholder();
    
    // Step 2: Create a virtual card
    console.log('\n--- Step 2: Creating a virtual card ---');
    const cardId = await createVirtualCard(cardholderId);
    
    // Step 3: Retrieve card details
    console.log('\n--- Step 3: Retrieving card details ---');
    await getCardDetails(cardId);
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    if (error instanceof Error) {
      console.error('\nTest failed:', error.message);
    } else {
      console.error('\nTest failed with an unknown error');
    }
  }
}

// Run the test
testStripeVirtualCard();