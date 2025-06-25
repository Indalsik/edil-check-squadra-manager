// Test con utente esistente
const testExistingUser = async () => {
  const baseUrl = 'http://localhost:3002';
  
  console.log('🧪 Testing with existing user...\n');
  
  try {
    // 1. Test Login con utente esistente
    console.log('1. Testing login with existing user...');
    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful:', loginData);
      
      const token = loginData.token;
      
      // 2. Test Workers API
      console.log('\n2. Testing workers API...');
      
      // Get existing workers
      const workersResponse = await fetch(`${baseUrl}/workers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (workersResponse.ok) {
        const workers = await workersResponse.json();
        console.log('✅ Existing workers:', workers);
        
        // Create new worker with unique data
        const newWorkerResponse = await fetch(`${baseUrl}/workers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: `Test Worker ${Date.now()}`,
            role: 'Elettricista',
            phone: '+39 333 9876543',
            email: `worker${Date.now()}@example.com`,
            status: 'Attivo',
            hourlyRate: 22.00
          })
        });
        
        if (newWorkerResponse.ok) {
          const newWorker = await newWorkerResponse.json();
          console.log('✅ New worker created:', newWorker);
        }
      }
      
      // 3. Test Sites API
      console.log('\n3. Testing sites API...');
      
      const sitesResponse = await fetch(`${baseUrl}/sites`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (sitesResponse.ok) {
        const sites = await sitesResponse.json();
        console.log('✅ Existing sites:', sites);
        
        // Create new site
        const newSiteResponse = await fetch(`${baseUrl}/sites`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: `Test Site ${Date.now()}`,
            owner: 'Test Owner',
            address: 'Via Test 123',
            status: 'Attivo',
            startDate: '2024-01-01',
            estimatedEnd: '2024-12-31'
          })
        });
        
        if (newSiteResponse.ok) {
          const newSite = await newSiteResponse.json();
          console.log('✅ New site created:', newSite);
        }
      }
      
      // 4. Test Dashboard Stats
      console.log('\n4. Testing dashboard stats...');
      const statsResponse = await fetch(`${baseUrl}/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        console.log('✅ Dashboard stats:', stats);
      }
      
      // 5. Test Time Entries
      console.log('\n5. Testing time entries...');
      const timeEntriesResponse = await fetch(`${baseUrl}/time-entries`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (timeEntriesResponse.ok) {
        const timeEntries = await timeEntriesResponse.json();
        console.log('✅ Time entries:', timeEntries);
      }
      
      // 6. Test Payments
      console.log('\n6. Testing payments...');
      const paymentsResponse = await fetch(`${baseUrl}/payments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (paymentsResponse.ok) {
        const payments = await paymentsResponse.json();
        console.log('✅ Payments:', payments);
      }
      
    } else {
      const errorData = await loginResponse.json();
      console.log('❌ Login failed:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testExistingUser();