// Simple API connectivity test utility
export async function testApiConnectivity(): Promise<boolean> {
  try {
    const response = await fetch('/api/test', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('API connectivity test successful:', data);
      return true;
    } else {
      console.error('API connectivity test failed with status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('API connectivity test failed with error:', error);
    return false;
  }
}

// Test multiple endpoints
export async function testMultipleEndpoints(): Promise<{ [key: string]: boolean }> {
  const endpoints = [
    '/api/test',
    '/api/users',
    '/api/leads/stats',
    '/api/follow-ups'
  ];
  
  const results: { [key: string]: boolean } = {};
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      results[endpoint] = response.ok;
      console.log(`Endpoint ${endpoint}: ${response.ok ? 'OK' : 'FAILED'} (${response.status})`);
    } catch (error) {
      results[endpoint] = false;
      console.error(`Endpoint ${endpoint} failed:`, error);
    }
  }
  
  return results;
}
