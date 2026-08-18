require('dotenv').config();
const pool = require('./src/config/database');

async function fixMapping() {
  try {
    console.log('\n🔧 Fixing exam_questions mapping for exam_id=29...\n');

    // 1. Find all spelling questions (615-669 range or similar)
    const questionsRes = await pool.query(
      `SELECT id FROM questions
       WHERE title ILIKE '%ortogr%' OR title ILIKE '%gramát%' OR id >= 615
       ORDER BY id`
    );

    console.log(`Found ${questionsRes.rows.length} potential spelling questions`);

    if (questionsRes.rows.length === 0) {
      console.log('❌ No spelling questions found');
      pool.end();
      return;
    }

    // 2. Add mappings to exam_questions if they don't exist
    let addedCount = 0;
    for (let i = 0; i < questionsRes.rows.length; i++) {
      const questionId = questionsRes.rows[i].id;

      try {
        await pool.query(
          `INSERT INTO exam_questions (exam_id, question_id, question_order)
           VALUES ($1, $2, $3)
           ON CONFLICT (exam_id, question_id) DO NOTHING`,
          [29, questionId, i + 1]
        );
        addedCount++;
      } catch (err) {
        console.warn(`  Warning for Q${questionId}: ${err.message}`);
      }
    }

    console.log(`✅ Added/updated ${addedCount} mappings`);

    // 3. Verify
    const verifyRes = await pool.query(
      `SELECT COUNT(*) as total FROM exam_questions WHERE exam_id = 29`
    );

    console.log(`\n✅ Total questions now mapped to exam 29: ${verifyRes.rows[0].total}\n`);

    pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    pool.end();
  }
}

fixMapping();
