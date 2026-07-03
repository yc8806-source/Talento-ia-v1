const pool = require('../src/config/database');

async function addCandidateFields() {
  try {
    console.log('📋 Agregando campos al perfil de candidatos...\n');

    const queries = [
      // Experiencia
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS years_experience INTEGER DEFAULT 0;`,

      // Últimas 3 empresas (JSON array)
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS previous_companies TEXT;`,

      // Educación (JSON array)
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS education TEXT;`,

      // Habilidades (JSON array)
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS skills TEXT;`,

      // Certificaciones
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS certifications TEXT;`,

      // Idiomas (JSON array)
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS languages TEXT;`,

      // Pretensión salarial
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS salary_expectation DECIMAL(12, 2);`,

      // Disponibilidad
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS availability_date DATE;`,

      // Disposición a viajar
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS willing_to_travel BOOLEAN DEFAULT false;`,

      // Ubicación
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS location TEXT;`,

      // Resumen profesional
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS professional_summary TEXT;`,

      // LinkedIn URL
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS linkedin_url TEXT;`,

      // GitHub URL
      `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS github_url TEXT;`,
    ];

    for (const query of queries) {
      try {
        await pool.query(query);
        console.log('✓ ' + query.split('ADD COLUMN')[1].split('DEFAULT')[0].trim());
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⊘ Campo ya existe: ' + query.split('ADD COLUMN')[1].split('DEFAULT')[0].trim());
        } else {
          throw error;
        }
      }
    }

    console.log('\n✨ Campos agregados exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addCandidateFields();
