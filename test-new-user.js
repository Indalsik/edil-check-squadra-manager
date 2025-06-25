// Test con nuovo utente
const testNewUser = async () => {
  const baseUrl = 'http://localhost:3002';
  const timestamp = Date.now();
  const testEmail = `user${timestamp}@example.com`;
  
  console.log('🧪 Testing with new user...\n');
  console.log(`📧 Using email: ${testEmail}`);
  
  try {
    // 1. Register new user
    console.log('\n1. Registering new user...');
    const registerResponse = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'password123'
      })
    });
    
    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      console.log('✅ Registration successful:', registerData);
      
      const token = registerData.token;
      
      // 2. Test empty state
      console.log('\n2. Testing empty state...');
      
      const workersResponse = await fetch(`${baseUrl}/workers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const workers = await workersResponse.json();
      console.log('✅ Workers (should be empty):', workers);
      
      const sitesResponse = await fetch(`${baseUrl}/sites`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const sites = await sitesResponse.json();
      console.log('✅ Sites (should be empty):', sites);
      
      // 3. Create test data
      console.log('\n3. Creating test data...');
      
      // Create worker
      const workerResponse = await fetch(`${baseUrl}/workers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: 'Giuseppe Verdi',
          role: 'Idraulico',
          phone: '+39 333 5555555',
          email: `giuseppe${timestamp}@example.com`,
          status: 'Attivo',
          hourlyRate: 20.00
        })
      });
      
      if (workerResponse.ok) {
        const worker = await workerResponse.json();
        console.log('✅ Worker created:', worker);
        
        // Create site
        const siteResponse = await fetch(`${baseUrl}/sites`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: 'Progetto Test',
            owner: 'Cliente Test',
            address: 'Via Roma 456',
            status: 'Attivo',
            startDate: '2024-01-15',
            estimatedEnd: '2024-06-30'
          })
        });
        
        if (siteResponse.ok) {
          const site = await siteResponse.json();
          console.log('✅ Site created:', site);
          
          // Create time entry
          const timeEntryResponse = await fetch(`${baseUrl}/time-entries`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              workerId: worker.id,
              siteId: site.id,
              date: '2024-01-20',
              startTime: '08:00',
              endTime: '17:00',
              totalHours: 8,
              status: 'Confermato'
            })
          });
          
          if (timeEntryResponse.ok) {
            const timeEntry = await timeEntryResponse.json();
            console.log('✅ Time entry created:', timeEntry);
          }
          
          // Create payment
          const paymentResponse = await fetch(`${baseUrl}/payments`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              workerId: worker.id,
              week: 'Settimana 3/2024',
              hours: 40,
              hourlyRate: 20.00,
              totalAmount: 800,
              overtime: 0,
              status: 'Da Pagare'
            })
          });
          
          if (paymentResponse.ok) {
            const payment = await paymentResponse.json();
            console.log('✅ Payment created:', payment);
          }
        }
      }
      
      // 4. Final stats check
      console.log('\n4. Final dashboard stats...');
      const finalStatsResponse = await fetch(`${baseUrl}/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (finalStatsResponse.ok) {
        const finalStats = await finalStatsResponse.json();
        console.log('✅ Final stats:', finalStats);
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
testNewUser();