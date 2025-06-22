import OpenAI from 'openai';

// Type definitions
interface MerchantData {
  category: string;
  category_code: string;
  city: string;
  country: string;
  name: string;
  network_id: string;
  postal_code: string;
  state: string;
}

interface SubscriptionDetails {
    name: string;
    type: string;
    expected_merchant?: string;
    expected_country?: string;
    expected_category_codes?: string[];
}
  
interface VerificationResult {
    status: 'MATCH' | 'NO_MATCH';
    confidence: number;
    explanation: string;
}
  
class SubscriptionVerifier {
    private openai: OpenAI;
  
    constructor(apiKey: string) {
      this.openai = new OpenAI({ apiKey });
    }
  
    /**
     * Verify if a purchase corresponds to the correct subscription using GPT
     */
    async verifyWithGPT(
      merchantData: MerchantData,
      expectedSubscription: string
    ): Promise<VerificationResult> {
      const prompt = `
      Analyze this merchant transaction data and determine if it matches the expected subscription type.
      
      Merchant Data:
      ${JSON.stringify(merchantData, null, 2)}
      
      Expected Subscription Type: ${expectedSubscription}
      
      Consider:
      - Merchant name and category
      - Business type based on category code
      - Geographic location relevance
      - Payment processors (like Stripe) that handle billing for other services
      
      Respond with:
      1. "MATCH" or "NO_MATCH"
      2. Confidence level (0-100%)
      3. Brief explanation
      
      Format as JSON:
      {"status": "MATCH/NO_MATCH", "confidence": 85, "explanation": "..."}
      `;
  
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
        });
  
        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('No response content from OpenAI');
        }
  
        return JSON.parse(content) as VerificationResult;
      } catch (error) {
        console.error('Error in GPT verification:', error);
        throw new Error(`GPT verification failed: ${error}`);
      }
    }
}