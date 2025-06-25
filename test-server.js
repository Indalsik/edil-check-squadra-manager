// Script di test per il server database
const testServer = async () => {
  const baseUrl = 'http://localhost:3002';
  
  console.log('🧪 Testing Edil-Check Database Server...\n');
  
  try {
    // 1. Test Health Check
    console.log('1. Testing health check...');
    const healthResponse = await fetch(`${baseUrl}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health:', healthData);
    
    // 2. Test Registration
    console.log('\n2. Testing user registration...');
    const registerResponse = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      console.log('✅ Registration successful:', registerData);
      
      const token = registerData.token;
      
      // 3. Test Workers API
      console.log('\n3. Testing workers API...');
      
      // Create worker
      const workerResponse = await fetch(`${baseUrl}/workers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: 'Mario Rossi',
          role: 'Muratore',
          phone: '+39 333 1234567',
          email: 'mario@example.com',
          status: 'Attivo',
          hourlyRate: 18.50
        })
      });
      
      if (workerResponse.ok) {
        const workerData = await workerResponse.json();
        console.log('✅ Worker created:', workerData);
        
        // Get workers
        const workersListResponse = await fetch(`${baseUrl}/workers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const workersList = await workersListResponse.json();
        console.log('✅ Workers list:', workersList);
      }
      
      // 4. Test Dashboard Stats
      console.log('\n4. Testing dashboard stats...');
      const statsResponse = await fetch(`${baseUrl}/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('✅ Dashboard stats:', statsData);
      }
      
    } else {
      const errorData = await registerResponse.json();
      console.log('❌ Registration failed:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testServer();