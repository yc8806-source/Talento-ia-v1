require('dotenv').config();
const pool = require('../src/config/database');

async function fixSoftSkillsTest() {
  try {
    // Find all TEST DE SOFT SKILLS exams
    const result = await pool.query(
      "SELECT id, name, type FROM exams WHERE name LIKE '%SOFT SKILLS%' ORDER BY id"
    );

    console.log(`Found ${result.rows.length} TEST DE SOFT SKILLS exams:`);
    result.rows.forEach(row => {
      console.log(`  ID: ${row.id}, Name: ${row.name}, Type: ${row.type}`);
    });

    // Keep only the first one, delete the rest
    if (result.rows.length > 1) {
      const examToKeep = result.rows[0].id;
      const examsToDelete = result.rows.slice(1).map(r => r.id);

      console.log(`\nKeeping exam ID: ${examToKeep}`);
      console.log(`Deleting exam IDs: ${examsToDelete.join(', ')}`);

      for (const examId of examsToDelete) {
        // Delete questions first
        await pool.query('DELETE FROM question_options WHERE question_id IN (SELECT id FROM questions WHERE exam_id = $1)', [examId]);
        await pool.query('DELETE FROM questions WHERE exam_id = $1', [examId]);

        // Delete exam
        await pool.query('DELETE FROM exams WHERE id = $1', [examId]);
        console.log(`✅ Deleted exam ${examId}`);
      }

      console.log(`\n✅ Removed ${examsToDelete.length} duplicate TEST DE SOFT SKILLS exams`);
    } else {
      console.log('\n✅ No duplicates found');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixSoftSkillsTest();
