const mammoth = require('mammoth');
const fs = require('fs');

async function extractQuestions() {
  try {
    const docPath = 'C:\\Users\\usuario\\Downloads\\Cuestionario_Ortografia_Gramatica.docx';

    const result = await mammoth.extractRawText({ path: docPath });
    const fullText = result.value;

    console.log('📄 Document content (first 2000 chars):');
    console.log(fullText.substring(0, 2000));
    console.log('\n... (truncated)\n');

    // Save to file for analysis
    fs.writeFileSync('extracted_content.txt', fullText);
    console.log('✅ Full content saved to extracted_content.txt');
    console.log(`Total length: ${fullText.length} chars`);

  } catch (err) {
    console.error('Error:', err.message);
  }
}

extractQuestions();
