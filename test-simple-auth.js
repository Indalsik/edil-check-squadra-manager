// Test del nuovo sistema di autenticazione semplice
const testSimpleAuth = async () => {
  const baseUrl = 'http://localhost:3002';
  const timestamp = Date.now();
  const testEmail = `user${timestamp}@example.com`;
  const testPassword = 'password123';
  
  console.log('🧪 Testing Simple Authentication System...\n');
  console.log(`📧 Using email: ${testEmail}`);
  console.log(`🔑 Using password: ${testPassword}`);
  
  try {
    // 1. Test Health Check
    console.log('\n1. Testing health check...');
    const healthResponse = await fetch(`${baseUrl}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health:', healthData);
    
    // 2. Register new user
    console.log('\n2. Registering new user...');
    const registerResponse = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    
    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      console.log('✅ Registration successful:', registerData);
      
      // 3. Test Login
      console.log('\n3. Testing login...');
      const loginResponse = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword
        })
      });
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        console.log('✅ Login successful:', loginData);
        
        // 4. Test authenticated request with credentials in headers
        console.log('\n4. Testing authenticated request...');
        const workersResponse = await fetch(`${baseUrl}/workers`, {
          headers: {
            'X-User-Email': testEmail,
            'X-User-Password': testPassword
          }
        });
        
        if (workersResponse.ok) {
          const workers = await workersResponse.json();
          console.log('✅ Workers request successful (should be empty):', workers);
          
          // 5. Create a worker
          console.log('\n5. Creating a worker...');
          const createWorkerResponse = await fetch(`${baseUrl}/workers`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-User-Email': testEmail,
              'X-User-Password': testPassword
            },
            body: JSON.stringify({
              name: 'Test Worker',
              role: 'Muratore',
              phone: '+39 333 1234567',
              email: 'worker@example.com',
              status: 'Attivo',
              hourlyRate: 18.50
            })
          });
          
          if (createWorkerResponse.ok) {
            const newWorker = await createWorkerResponse.json();
            console.log('✅ Worker created:', newWorker);
            
            // 6. Test dashboard stats
            console.log('\n6. Testing dashboard stats...');
            const statsResponse = await fetch(`${baseUrl}/dashboard/stats`, {
              headers: {
                'X-User-Email': testEmail,
                'X-User-Password': testPassword
              }
            });
            
            if (statsResponse.ok) {
              const stats = await statsResponse.json();
              console.log('✅ Dashboard stats:', stats);
            }
          }
        }
        
        // 7. Test wrong credentials
        console.log('\n7. Testing wrong credentials...');
        const wrongCredsResponse = await fetch(`${baseUrl}/workers`, {
          headers: {
            'X-User-Email': testEmail,
            'X-User-Password': 'wrongpassword'
          }
        });
        
        if (!wrongCredsResponse.ok) {
          console.log('✅ Wrong credentials correctly rejected:', wrongCredsResponse.status);
        }
        
      } else {
        const loginError = await loginResponse.json();
        console.log('❌ Login failed:', loginError);
      }
      
    } else {
      const registerError = await registerResponse.json();
      console.log('❌ Registration failed:', registerError);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testSimpleAuth();