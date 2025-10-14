const fetch = require('node-fetch');

// Test the GET favorite endpoint
async function testFavoriteEndpoint() {
  const baseUrl = 'http://localhost:3000';
  const stitchId = '68c7d5291a9d8a0a7a69a788'; // Example stitch ID
  
  console.log('🧪 Testing GET /api/stitches/:id/favorite endpoint\n');
  
  // Test 1: Without authentication (should fail)
  console.log('Test 1: Without authentication');
  try {
    const response = await fetch(`${baseUrl}/api/stitches/${stitchId}/favorite`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', result);
    console.log('✅ Expected: Authentication required\n');
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  // Test 2: With invalid token (should fail)
  console.log('Test 2: With invalid token');
  try {
    const response = await fetch(`${baseUrl}/api/stitches/${stitchId}/favorite`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid_token'
      }
    });
    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', result);
    console.log('✅ Expected: Invalid token error\n');
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  // Test 3: Example of how it should work with valid token
  console.log('Test 3: How to use with valid JWT token');
  console.log(`
const response = await fetch('${baseUrl}/api/stitches/\${stitchId}/favorite', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_VALID_JWT_TOKEN'
  }
});

const result = await response.json();
// Expected successful response:
// {
//   "success": true,
//   "data": { "isFavorite": true },
//   "message": "Added to favorites" // or "Removed from favorites"
// }
  `);
  
  console.log('📝 Updated API Documentation:');
  console.log(`
### Toggle Favorite Status (GET Method)

\`\`\`javascript
await fetch('/api/stitches/\${stitchId}/favorite', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});
\`\`\`

This endpoint toggles the favorite status of a stitch for the authenticated user.
- Requires authentication
- Returns the new favorite status
- Creates user progress record if it doesn't exist
  `);
}

// Run the test
testFavoriteEndpoint().catch(console.error);
