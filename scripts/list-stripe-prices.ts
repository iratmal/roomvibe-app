import Stripe from 'stripe';
import 'dotenv/config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20' as any,
});

async function listPrices() {
  console.log('🔍 Fetching Stripe products and prices...\n');
  
  try {
    const products = await stripe.products.list({ active: true, limit: 100 });
    
    console.log(`Found ${products.data.length} active products:\n`);
    
    for (const product of products.data) {
      console.log(`📦 Product: ${product.name}`);
      console.log(`   Product ID: ${product.id}`);
      
      const prices = await stripe.prices.list({ product: product.id, active: true });
      
      for (const price of prices.data) {
        const amount = price.unit_amount ? (price.unit_amount / 100).toFixed(2) : 'N/A';
        const currency = price.currency.toUpperCase();
        const interval = price.recurring?.interval || 'one-time';
        
        console.log(`   💰 Price ID: ${price.id}`);
        console.log(`      Amount: ${amount} ${currency}/${interval}`);
      }
      console.log('');
    }
    
    console.log('\n📋 Environment Variables to Set:');
    console.log('Copy the price IDs above and set them as environment variables:');
    console.log('  STRIPE_PRICE_ARTIST=price_xxx');
    console.log('  STRIPE_PRICE_DESIGNER=price_xxx');
    console.log('  STRIPE_PRICE_GALLERY=price_xxx');
    
  } catch (error: any) {
    console.error('❌ Error fetching Stripe data:', error.message);
  }
}

listPrices();
