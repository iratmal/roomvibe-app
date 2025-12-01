import 'dotenv/config';

const API_BASE = 'http://localhost:3001';

interface TestResult {
  step: string;
  success: boolean;
  message: string;
  data?: any;
}

const results: TestResult[] = [];

async function log(step: string, success: boolean, message: string, data?: any) {
  const icon = success ? '✅' : '❌';
  console.log(`${icon} ${step}: ${message}`);
  if (data) console.log('   Data:', JSON.stringify(data, null, 2));
  results.push({ step, success, message, data });
}

async function testLogin(email: string, password: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await res.json();
    
    if (res.ok && data.token) {
      await log('Login', true, `Logged in as ${email}`, { userId: data.user?.id });
      return data.token;
    } else {
      await log('Login', false, `Failed: ${data.error || 'Unknown error'}`);
      return null;
    }
  } catch (error: any) {
    await log('Login', false, `Error: ${error.message}`);
    return null;
  }
}

async function createCheckoutSession(token: string, plan: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/api/billing/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ plan }),
    });
    
    const data = await res.json();
    
    if (res.ok && data.url) {
      await log(`Checkout (${plan})`, true, 'Checkout session created', { url: data.url });
      return data.url;
    } else {
      await log(`Checkout (${plan})`, false, `Failed: ${data.error || 'Unknown error'}`, data);
      return null;
    }
  } catch (error: any) {
    await log(`Checkout (${plan})`, false, `Error: ${error.message}`);
    return null;
  }
}

async function getSubscriptionStatus(token: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/api/billing/subscription`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    const data = await res.json();
    
    if (res.ok) {
      await log('Subscription Status', true, 'Fetched subscription info', data);
      return data;
    } else {
      await log('Subscription Status', false, `Failed: ${data.error || 'Unknown error'}`);
      return null;
    }
  } catch (error: any) {
    await log('Subscription Status', false, `Error: ${error.message}`);
    return null;
  }
}

async function createPortalSession(token: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/api/billing/customer-portal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await res.json();
    
    if (res.ok && data.url) {
      await log('Customer Portal', true, 'Portal session created', { url: data.url });
      return data.url;
    } else {
      await log('Customer Portal', false, `Failed: ${data.error || 'Unknown error'}`, data);
      return null;
    }
  } catch (error: any) {
    await log('Customer Portal', false, `Error: ${error.message}`);
    return null;
  }
}

async function runTests() {
  console.log('\n🧪 STRIPE SUBSCRIPTION FLOW TEST\n');
  console.log('=' .repeat(60));
  
  const testEmail = 'testartist@example.com';
  const testPassword = 'testpassword123';
  
  console.log(`\n📧 Test User: ${testEmail}`);
  console.log('=' .repeat(60));
  
  const token = await testLogin(testEmail, testPassword);
  
  if (!token) {
    console.log('\n⚠️ Login failed. Creating test user...');
    
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPassword }),
      });
      
      if (res.ok) {
        console.log('✅ Test user created. Re-trying login...');
        const newToken = await testLogin(testEmail, testPassword);
        if (!newToken) {
          console.log('\n❌ Cannot proceed without authentication.\n');
          return;
        }
        await runTestsWithToken(newToken);
      }
    } catch (e) {
      console.log('\n❌ Cannot proceed without authentication.\n');
      return;
    }
  } else {
    await runTestsWithToken(token);
  }
}

async function runTestsWithToken(token: string) {
  console.log('\n📊 CURRENT SUBSCRIPTION STATUS');
  console.log('-'.repeat(40));
  await getSubscriptionStatus(token);
  
  console.log('\n🛒 CHECKOUT SESSION TESTS');
  console.log('-'.repeat(40));
  
  for (const plan of ['artist', 'designer', 'gallery']) {
    const checkoutUrl = await createCheckoutSession(token, plan);
    if (checkoutUrl) {
      console.log(`\n   🔗 ${plan.toUpperCase()} Checkout URL:`);
      console.log(`   ${checkoutUrl}\n`);
    }
  }
  
  console.log('\n🎫 CUSTOMER PORTAL TEST');
  console.log('-'.repeat(40));
  const portalUrl = await createPortalSession(token);
  
  console.log('\n' + '=' .repeat(60));
  console.log('📋 TEST SUMMARY');
  console.log('=' .repeat(60));
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\n   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  
  console.log('\n📝 NEXT STEPS FOR MANUAL TESTING:');
  console.log('-'.repeat(40));
  console.log('1. Copy a checkout URL above and open it in your browser');
  console.log('2. Complete payment with test card: 4242 4242 4242 4242');
  console.log('3. Use any future date for expiry and any 3 digits for CVC');
  console.log('4. After successful payment, check the database:');
  console.log('   SELECT email, role, subscription_status, subscription_plan FROM users;');
  console.log('5. For portal testing, first complete a checkout, then use the portal URL');
  console.log('\n');
}

runTests();
