const axios = require('axios');

// Test the endpoint locally to see what it returns
async function testEndpoint() {
  try {
    const token = '7bc30840cf8f5f5d16de76d62be67887a2384544488adea55d6614e0da357a19'; // candidate 90's token
    const apiUrl = 'http://localhost:3000/api';

    console.log('\n🔍 Testing /evaluations/vacancy-by-token endpoint\n');
    console.log(`Token: ${token}`);
    console.log(`URL: ${apiUrl}/evaluations/vacancy-by-token/${token}\n`);

    const response = await axios.get(`${apiUrl}/evaluations/vacancy-by-token/${token}`);

    console.log('Response received:');
    console.log(JSON.stringify(response.data, null, 2));

    console.log('\n✅ Exams in response:');
    if (response.data.exams && Array.isArray(response.data.exams)) {
      response.data.exams.forEach((exam, idx) => {
        console.log(`  [${idx}] ID: ${exam.id}, Type: ${exam.type}, Name: ${exam.name}, Completed: ${exam.completed}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Response:', error.response.data);
    }
  }
}

testEndpoint();
