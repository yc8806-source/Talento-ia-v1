const pool = require('../src/config/database');
const fs = require('fs');
const csv = require('csv-parser');

/**
 * Importa candidatos desde un archivo CSV
 * Formato esperado:
 * firstName, lastName, email, phone, yearsExperience, location, skills, languages
 */
async function importCandidatesFromCSV(filePath, createdBy = 1) {
  try {
    console.log(`📥 Importando candidatos desde: ${filePath}\n`);

    const candidates = [];
    let imported = 0;
    let errors = [];

    // Leer y parsear CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          candidates.push({
            firstName: row['firstName'] || row['first_name'] || '',
            lastName: row['lastName'] || row['last_name'] || '',
            email: row['email'] || '',
            phone: row['phone'] || '',
            yearsExperience: parseInt(row['yearsExperience'] || row['years_experience'] || 0),
            location: row['location'] || '',
            skills: row['skills'] || '',
            languages: row['languages'] || '',
            professionalSummary: row['professionalSummary'] || row['professional_summary'] || '',
            salaryExpectation: parseFloat(row['salaryExpectation'] || row['salary_expectation'] || 0),
            availabilityDate: row['availabilityDate'] || row['availability_date'] || null,
            willingToTravel: row['willingToTravel'] === 'true' || row['willing_to_travel'] === 'true',
            linkedinUrl: row['linkedinUrl'] || row['linkedin_url'] || '',
            githubUrl: row['githubUrl'] || row['github_url'] || ''
          });
        })
        .on('error', reject)
        .on('end', resolve);
    });

    console.log(`📋 ${candidates.length} candidatos para procesar\n`);

    // Insertar candidatos
    for (const candidate of candidates) {
      try {
        // Validar email
        if (!candidate.email || !candidate.email.includes('@')) {
          errors.push({ email: candidate.email, error: 'Email inválido' });
          continue;
        }

        // Verificar si ya existe
        const existing = await pool.query(
          'SELECT id FROM candidates WHERE email = $1',
          [candidate.email]
        );

        if (existing.rows.length > 0) {
          errors.push({ email: candidate.email, error: 'Email ya existe' });
          continue;
        }

        // Insertar
        await pool.query(
          `INSERT INTO candidates
           (first_name, last_name, email, phone, years_experience, location,
            skills, languages, professional_summary, salary_expectation,
            availability_date, willing_to_travel, linkedin_url, github_url, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [
            candidate.firstName,
            candidate.lastName,
            candidate.email,
            candidate.phone,
            candidate.yearsExperience,
            candidate.location,
            candidate.skills,
            candidate.languages,
            candidate.professionalSummary,
            candidate.salaryExpectation || null,
            candidate.availabilityDate || null,
            candidate.willingToTravel,
            candidate.linkedinUrl,
            candidate.githubUrl,
            createdBy
          ]
        );

        imported++;
        console.log(`✓ ${candidate.firstName} ${candidate.lastName} (${candidate.email})`);
      } catch (error) {
        errors.push({
          email: candidate.email,
          error: error.message
        });
      }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`   ✓ Importados: ${imported}`);
    console.log(`   ✗ Errores: ${errors.length}`);

    if (errors.length > 0) {
      console.log(`\n⚠️ Errores:`);
      errors.forEach(e => console.log(`   - ${e.email}: ${e.error}`));
    }

    return { imported, errors };
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

module.exports = importCandidatesFromCSV;
