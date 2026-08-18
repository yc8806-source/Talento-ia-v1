const axios = require('axios');

async function testExam29() {
  try {
    const apiUrl = 'http://localhost:3000/api';

    console.log('\n🔍 Testing /exams/29 endpoint\n');

    const response = await axios.get(`${apiUrl}/exams/29`);

    console.log('✅ Response received:');
    console.log(`  ID: ${response.data.id}`);
    console.log(`  Name: ${response.data.name}`);
    console.log(`  Type: ${response.data.type}`);
    console.log(`  Questions count: ${response.data.questions ? response.data.questions.length : 0}`);

    if (response.data.questions && response.data.questions.length > 0) {
      console.log(`\n  First question:`);
      const q = response.data.questions[0];
      console.log(`    ID: ${q.id}`);
      console.log(`    Title: ${q.title}`);
      console.log(`    Options: ${q.options ? q.options.length : 0}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testExam29();
