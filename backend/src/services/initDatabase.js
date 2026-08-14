const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  try {
    console.log('🔍 Checking database schema...');

    // Check if tables exist
    const tablesCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'candidate_vacancies'
      )
    `);

    const tableExists = tablesCheck.rows[0].exists;
    console.log(`📊 candidate_vacancies table exists: ${tableExists}`);

    if (!tableExists) {
      console.log('📋 Tables missing - initializing database schema...');

      // Check if migration file exists
      const migrationPath = path.join(__dirname, '../../migrations/001_create_invitations_tables.sql');
      console.log(`🔎 Looking for migration file at: ${migrationPath}`);

      if (!fs.existsSync(migrationPath)) {
        console.error(`❌ Migration file not found at ${migrationPath}`);
        return;
      }

      // Read and execute migration
      const migrationScript = fs.readFileSync(migrationPath, 'utf8');
      console.log(`📖 Migration file loaded (${migrationScript.length} bytes)`);

      // Split by statements and execute
      const statements = migrationScript
        .split(';')
        .map(stmt => {
          // Remove comments and trim
          return stmt
            .split('\n')
            .filter(line => !line.trim().startsWith('--'))
            .join('\n')
            .trim();
        })
        .filter(stmt => stmt && stmt.length > 0);

      console.log(`📦 Found ${statements.length} SQL statements to execute`);

      let successCount = 0;
      let errorCount = 0;

      for (const statement of statements) {
        try {
          await pool.query(statement);
          successCount++;
          const preview = statement.substring(0, 50).replace(/\n/g, ' ');
          console.log(`✅ [${successCount}/${statements.length}] Executed: ${preview}...`);
        } catch (err) {
          // Ignore errors from IF EXISTS checks
          if (!err.message.includes('already exists')) {
            errorCount++;
            console.warn(`⚠️ Warning executing statement: ${err.message}`);
            console.warn(`   Statement: ${statement.substring(0, 100)}...`);
          }
        }
      }

      console.log(`✅ Database schema initialization complete (${successCount} succeeded, ${errorCount} with warnings)`);

      // Verify tables were created
      const verifyCheck = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'candidate_vacancies'
        )
      `);

      if (verifyCheck.rows[0].exists) {
        console.log('✅ VERIFIED: candidate_vacancies table created successfully');
      } else {
        console.error('❌ ERROR: candidate_vacancies table still does not exist after initialization');
      }
    } else {
      console.log('✅ Database schema already exists - no initialization needed');
    }

    // Aplicar migración 010: Agregar typing_test_id a exams
    console.log('🔄 Verificando migración 010 (typing_test_id)...');
    try {
      const checkColumn = await pool.query(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_name = 'exams' AND column_name = 'typing_test_id'`
      );

      if (checkColumn.rows.length === 0) {
        console.log('📝 Aplicando migración 010: Agregar typing_test_id a exams...');

        await pool.query(`
          ALTER TABLE exams
          ADD COLUMN IF NOT EXISTS typing_test_id INTEGER REFERENCES typing_tests(id) ON DELETE SET NULL;
        `);

        await pool.query(`
          CREATE INDEX IF NOT EXISTS idx_exams_typing_test_id ON exams(typing_test_id);
        `);

        console.log('✅ Migración 010 aplicada');
      } else {
        console.log('✅ Migración 010 ya aplicada (typing_test_id column exists)');
      }

      // Aplicar migración 011: Cambiar tamaño de columnas WPM en typing_results
      console.log('🔄 Verificando migración 011 (typing_results WPM columns)...');
      try {
        // Primero verificar si la tabla existe
        const tableExists = await pool.query(
          `SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'typing_results')`
        );

        if (!tableExists.rows[0].exists) {
          console.log('⚠️ Tabla typing_results no existe - se creará con DECIMAL(10,2)');
        } else {
          // Verificar el tipo de dato actual de la columna wpm
          const columnInfo = await pool.query(`
            SELECT data_type, numeric_precision, numeric_scale
            FROM information_schema.columns
            WHERE table_name = 'typing_results' AND column_name = 'wpm'
          `);

          if (columnInfo.rows.length > 0) {
            const current = columnInfo.rows[0];
            console.log(`📊 Columna wpm actual: ${current.data_type}(${current.numeric_precision},${current.numeric_scale})`);

            // Si es DECIMAL(5,2), necesita actualización
            if (current.numeric_precision === 5 && current.numeric_scale === 2) {
              console.log('📝 Aplicando migración 011: Actualizando DECIMAL(5,2) → DECIMAL(10,2)...');

              // Ejecutar ALTER TABLE en cada columna por separado para mejor manejo de errores
              const columns = ['wpm', 'accuracy', 'gross_wpm', 'net_wpm'];
              for (const col of columns) {
                try {
                  await pool.query(`ALTER TABLE typing_results ALTER COLUMN ${col} TYPE DECIMAL(10,2);`);
                  console.log(`  ✅ ${col}: DECIMAL(5,2) → DECIMAL(10,2)`);
                } catch (colErr) {
                  console.error(`  ❌ Error actualizando ${col}:`, colErr.message);
                }
              }

              console.log('✅ Migración 011 completada');
            } else {
              console.log(`✅ Migración 011 ya aplicada (columnas ya son ${current.data_type}(${current.numeric_precision},${current.numeric_scale}))`);
            }
          }
        }
      } catch (err) {
        console.error('❌ Error en migración 011:', err.message);
        console.error('💡 Sugerencia: Si los datos en typing_results exceden 999.99, ejecutar manualmente:');
        console.error('   ALTER TABLE typing_results ALTER COLUMN wpm TYPE DECIMAL(10,2);');
        console.error('   ALTER TABLE typing_results ALTER COLUMN accuracy TYPE DECIMAL(10,2);');
        console.error('   ALTER TABLE typing_results ALTER COLUMN gross_wpm TYPE DECIMAL(10,2);');
        console.error('   ALTER TABLE typing_results ALTER COLUMN net_wpm TYPE DECIMAL(10,2);');
      }

      // Auto-asignar typing_test_id a exams de tipo 'typing' que sean NULL
      const nullExams = await pool.query(
        `SELECT id FROM exams WHERE type = 'typing' AND typing_test_id IS NULL`
      );

      if (nullExams.rows.length > 0) {
        console.log(`🔧 Encontrados ${nullExams.rows.length} exams de typing sin typing_test_id`);

        // Obtener el primer typing_test disponible
        const typingTests = await pool.query(`SELECT id FROM typing_tests ORDER BY id ASC LIMIT 1`);

        if (typingTests.rows.length > 0) {
          const typingTestId = typingTests.rows[0].id;

          // Actualizar todos los exams de typing null
          const updateResult = await pool.query(
            `UPDATE exams SET typing_test_id = $1 WHERE type = 'typing' AND typing_test_id IS NULL`,
            [typingTestId]
          );

          console.log(`✅ Actualizados ${updateResult.rowCount} exams de typing con typing_test_id = ${typingTestId}`);
        } else {
          console.warn('⚠️ No hay typing_tests disponibles para asignar');
        }
      } else {
        console.log('✅ Todos los exams de typing ya tienen typing_test_id asignado');
      }

      // Reparar candidate_vacancies huérfanas: crear candidatos faltantes
      console.log('🔧 Verificando candidate_vacancies huérfanas...');
      try {
        const orphanedCVs = await pool.query(
          `SELECT DISTINCT cv.candidate_id
           FROM candidate_vacancies cv
           LEFT JOIN candidates c ON cv.candidate_id = c.id
           WHERE c.id IS NULL`
        );

        if (orphanedCVs.rows.length > 0) {
          console.log(`⚠️ Encontradas ${orphanedCVs.rows.length} candidate_vacancies huérfanas`);

          for (const row of orphanedCVs.rows) {
            const cid = row.candidate_id;
            console.log(`📝 Creando candidato faltante con ID ${cid}...`);

            try {
              // Usar INSERT con WHERE NOT EXISTS para evitar errores de conflicto
              await pool.query(
                `INSERT INTO candidates (id, first_name, last_name, email, status)
                 SELECT $1, 'Candidato', 'Importado', 'candidato' || $1 || '@system.local', 'pending'
                 WHERE NOT EXISTS (SELECT 1 FROM candidates WHERE id = $1)`,
                [cid]
              );

              console.log(`✅ Candidato ${cid} creado/verificado`);
            } catch (err) {
              console.error(`⚠️ Error creando candidato ${cid}:`, err.message);
            }
          }
        } else {
          console.log('✅ No hay candidate_vacancies huérfanas');
        }
      } catch (err) {
        console.error('⚠️ Error reparando candidate_vacancies:', err.message);
      }
    } catch (err) {
      console.error('⚠️ Error verificando/aplicando migración 010:', err.message);
    }

  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    console.error('Stack:', error.stack);
    // Don't throw - allow app to continue
  }
}

module.exports = { initDatabase };
