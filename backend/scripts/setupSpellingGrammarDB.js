const { Pool } = require('pg');
const path = require('path');

// Leer .env manualmente
const fs = require('fs');
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...val] = trimmed.split('=');
    if (key) {
      envVars[key.trim()] = val.join('=').trim().replace(/^["']|["']$/g, '');
    }
  }
});

const connectionString = envVars.DATABASE_URL;

async function setupDatabase() {
  let client;
  try {
    console.log('🔄 Conectando a la base de datos...');

    // Usar un cliente simple sin pool
    client = new Pool({ connectionString });
    const conn = await client.connect();

    console.log('✅ Conectado a la base de datos');

    // 1. Crear tablas si no existen
    console.log('🔄 Creando tablas...');

    await conn.query(`
      CREATE TABLE IF NOT EXISTS spelling_grammar_tests (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        difficulty VARCHAR(50) DEFAULT 'medium',
        test_type VARCHAR(50) DEFAULT 'mixed',
        language VARCHAR(10) DEFAULT 'es',
        duration_seconds INT DEFAULT 1200,
        total_questions INT DEFAULT 50,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Tabla spelling_grammar_tests creada');

    await conn.query(`
      CREATE TABLE IF NOT EXISTS spelling_grammar_questions (
        id SERIAL PRIMARY KEY,
        test_id INT NOT NULL REFERENCES spelling_grammar_tests(id),
        question_type VARCHAR(50) NOT NULL,
        question_text TEXT NOT NULL,
        explanation TEXT,
        options JSONB,
        correct_answer VARCHAR(255) NOT NULL,
        difficulty VARCHAR(50) DEFAULT 'medium',
        order_number INT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Tabla spelling_grammar_questions creada');

    await conn.query(`
      CREATE TABLE IF NOT EXISTS spelling_grammar_results (
        id SERIAL PRIMARY KEY,
        candidate_id INT NOT NULL,
        candidate_vacancy_id INT,
        test_id INT NOT NULL REFERENCES spelling_grammar_tests(id),
        answers JSONB,
        score DECIMAL(5,2),
        percentage DECIMAL(5,2),
        correct_answers INT,
        time_taken_seconds INT,
        started_at TIMESTAMP,
        completed_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Tabla spelling_grammar_results creada');

    // 2. Insertar test
    console.log('🔄 Insertando test...');
    const testResult = await conn.query(`
      INSERT INTO spelling_grammar_tests (title, description, difficulty, test_type, duration_seconds, total_questions, language)
      VALUES ('Prueba de Ortografía y Gramática', 'Evaluación de 50 preguntas sobre ortografía, gramática e identificación de errores', 'medium', 'mixed', 1200, 50, 'es')
      ON CONFLICT DO NOTHING
      RETURNING id
    `);

    let testId = testResult.rows[0]?.id;
    if (!testId) {
      const existing = await conn.query("SELECT id FROM spelling_grammar_tests WHERE title = 'Prueba de Ortografía y Gramática' LIMIT 1");
      testId = existing.rows[0].id;
    }
    console.log('✅ Test ID:', testId);

    // 3. Preparar preguntas - NUEVO BANCO (Nivel Básico-Intermedio)
    const questions = [
      // Selección múltiple (1-30)
      {type: 'multiple_choice', text: '¿Cuál palabra está correctamente escrita?', exp: 'Verifica la ortografía', opts: {a:'Exepción',b:'Excepción',c:'Excepsión',d:'Exepcion'}, ans: 'b', ord: 1},
      {type: 'multiple_choice', text: 'Seleccione la oración correcta.', exp: 'Elige la opción gramaticalmente correcta', opts: {a:'Hubieron muchos clientes.',b:'Habían muchas personas.',c:'Hubo muchos clientes.',d:'Hubieron personas esperando.'}, ans: 'c', ord: 2},
      {type: 'multiple_choice', text: '¿Cuál palabra lleva tilde?', exp: 'Revisa dónde va la acentuación', opts: {a:'Arbol',b:'Arboles',c:'Árbol',d:'Arbole'}, ans: 'c', ord: 3},
      {type: 'multiple_choice', text: '¿Cuál opción está correctamente escrita?', exp: 'Observa la estructura correcta', opts: {a:'Hacerce responsable',b:'Hacerse responsable',c:'Haserse responsable',d:'Aserse responsable'}, ans: 'b', ord: 4},
      {type: 'multiple_choice', text: 'Seleccione la palabra correcta.', exp: 'Considera el significado de cada opción', opts: {a:'Haber',b:'A ver',c:'Aver',d:'Haver'}, ans: 'b', ord: 5},
      {type: 'multiple_choice', text: '¿Cuál oración está correctamente escrita?', exp: 'Fíjate en la puntuación y ortografía', opts: {a:'Él vino ayer.',b:'El vino ayer.',c:'Él bino ayer.',d:'El bino ayer.'}, ans: 'a', ord: 6},
      {type: 'multiple_choice', text: 'Seleccione la palabra correctamente escrita.', exp: 'Comprueba la ortografía', opts: {a:'Conmigo',b:'Con migo',c:'Conmígo',d:'Con migoo'}, ans: 'a', ord: 7},
      {type: 'multiple_choice', text: '¿Cuál palabra está mal escrita?', exp: 'Identifica el error ortográfico', opts: {a:'Ingeniería',b:'Eficiencia',c:'Recepción',d:'Ecselente'}, ans: 'd', ord: 8},
      {type: 'multiple_choice', text: '¿Cuál oración es correcta?', exp: 'Revisa la conjugación del verbo', opts: {a:'Se me olvidó.',b:'Se me olvido.',c:'Sé me olvidó.',d:'Se mé olvidó.'}, ans: 'a', ord: 9},
      {type: 'multiple_choice', text: '¿Cuál palabra es un verbo?', exp: 'Identifica la clase gramatical', opts: {a:'Comunicación',b:'Comunicar',c:'Comunicador',d:'Comunicativo'}, ans: 'b', ord: 10},
      {type: 'multiple_choice', text: 'Seleccione la opción correcta.', exp: 'Considera el contexto de la pregunta', opts: {a:'Porque no vino.',b:'¿Por qué no vino?',c:'Porqué no vino.',d:'Por que no vino.'}, ans: 'b', ord: 11},
      {type: 'multiple_choice', text: '¿Cuál palabra está correctamente escrita?', exp: 'Verifica la ortografía', opts: {a:'Bién',b:'Bien',c:'Vien',d:'Vién'}, ans: 'b', ord: 12},
      {type: 'multiple_choice', text: '¿Cuál oración está correctamente puntuada?', exp: 'Revisa los signos de puntuación', opts: {a:'Buenos días, ¿cómo está?',b:'Buenos días ¿cómo está?',c:'Buenos días ¿Cómo está?',d:'Buenos días como está.'}, ans: 'a', ord: 13},
      {type: 'multiple_choice', text: 'Seleccione la palabra correcta.', exp: 'Distingue entre palabras similares', opts: {a:'Valla',b:'Baya',c:'Vaya',d:'Balla'}, ans: 'c', ord: 14},
      {type: 'multiple_choice', text: '¿Cuál palabra está correctamente escrita?', exp: 'Revisa cada opción cuidadosamente', opts: {a:'Asesor',b:'Acesor',c:'Hasesor',d:'Asezor'}, ans: 'a', ord: 15},
      {type: 'multiple_choice', text: '¿Qué opción está correctamente escrita?', exp: 'Observa el acento en las opciones', opts: {a:'Aun así',b:'Aún así',c:'Aun asì',d:'Ahún así'}, ans: 'b', ord: 16},
      {type: 'multiple_choice', text: 'Seleccione la oración correcta.', exp: 'Analiza la estructura de la frase', opts: {a:'Voy hacer una llamada.',b:'Voy a hacer una llamada.',c:'Boy a hacer una llamada.',d:'Voy haser una llamada.'}, ans: 'b', ord: 17},
      {type: 'multiple_choice', text: '¿Cuál palabra lleva "h"?', exp: 'Determina cuál palabra requiere la letra h', opts: {a:'Ora',b:'Hora',c:'Oraa',d:'Orah'}, ans: 'b', ord: 18},
      {type: 'multiple_choice', text: '¿Cuál oración es correcta?', exp: 'Comprueba tildes y ortografía', opts: {a:'Él tiene experiencia.',b:'El tiene experiencia.',c:'Él tiene esperiencia.',d:'El tiene esperiencia.'}, ans: 'a', ord: 19},
      {type: 'multiple_choice', text: 'Seleccione la palabra correcta.', exp: 'Verifica la ortografía completa', opts: {a:'Atención',b:'Atensión',c:'Atencion',d:'Atenzión'}, ans: 'a', ord: 20},
      {type: 'multiple_choice', text: '¿Cuál palabra está bien escrita?', exp: 'Identifica la escritura correcta', opts: {a:'Cliente',b:'Clente',c:'Clliente',d:'Clientee'}, ans: 'a', ord: 21},
      {type: 'multiple_choice', text: 'Seleccione el sinónimo de "rápido".', exp: 'Encuentra la palabra con significado similar', opts: {a:'Lento',b:'Ágil',c:'Pesado',d:'Difícil'}, ans: 'b', ord: 22},
      {type: 'multiple_choice', text: '¿Cuál palabra está correctamente escrita?', exp: 'Revisa la ortografía', opts: {a:'Organización',b:'Organisación',c:'Organizacion',d:'Organisacion'}, ans: 'a', ord: 23},
      {type: 'multiple_choice', text: '¿Cuál oración es correcta?', exp: 'Analiza cada alternativa', opts: {a:'Ellos vinieron temprano.',b:'Ellos vinierón temprano.',c:'Ellos binieron temprano.',d:'Ellos vinieron temprano,'}, ans: 'a', ord: 24},
      {type: 'multiple_choice', text: 'Seleccione la palabra correcta.', exp: 'Verifica la ortografía', opts: {a:'Información',b:'Informacion',c:'Ynformación',d:'Informasión'}, ans: 'a', ord: 25},
      {type: 'multiple_choice', text: '¿Cuál palabra está bien escrita?', exp: 'Observa los acentos', opts: {a:'Reunión',b:'Reuníon',c:'Reunion',d:'Rehunión'}, ans: 'a', ord: 26},
      {type: 'multiple_choice', text: 'Seleccione la palabra correcta.', exp: 'Revisa la acentuación', opts: {a:'También',b:'Tambien',c:'Tanbién',d:'Tambíen'}, ans: 'a', ord: 27},
      {type: 'multiple_choice', text: '¿Cuál palabra está correctamente escrita?', exp: 'Verifica cada letra', opts: {a:'Excelente',b:'Exelente',c:'Ecxelente',d:'Excelnte'}, ans: 'a', ord: 28},
      {type: 'multiple_choice', text: '¿Cuál palabra está correctamente escrita?', exp: 'Compara las opciones', opts: {a:'Decisión',b:'Decicion',c:'Decizión',d:'Desición'}, ans: 'a', ord: 29},
      {type: 'multiple_choice', text: 'Seleccione la palabra correcta.', exp: 'Verifica la escritura correcta', opts: {a:'Servicio',b:'Servisio',c:'Cerbicio',d:'Servivio'}, ans: 'a', ord: 30},

      // Completar frases (31-45)
      {type: 'fill_blank', text: '_____ muy importante llegar puntual al trabajo.', exp: 'Completa la frase', opts: null, ans: 'Es', ord: 31},
      {type: 'fill_blank', text: 'El cliente _____ satisfecho con la atención.', exp: 'Completa la frase', opts: null, ans: 'quedó', ord: 32},
      {type: 'fill_blank', text: 'Nosotros _____ la información ayer.', exp: 'Completa la frase', opts: null, ans: 'enviamos', ord: 33},
      {type: 'fill_blank', text: 'Por favor, _____ la puerta antes de salir.', exp: 'Completa la frase', opts: null, ans: 'cierre', ord: 34},
      {type: 'fill_blank', text: 'El asesor respondió _____.', exp: 'Completa la frase', opts: null, ans: 'correctamente', ord: 35},
      {type: 'fill_blank', text: 'El supervisor _____ el informe.', exp: 'Completa la frase', opts: null, ans: 'revisó', ord: 36},
      {type: 'fill_blank', text: 'La reunión fue _____.', exp: 'Completa la frase', opts: null, ans: 'productiva', ord: 37},
      {type: 'fill_blank', text: 'Todos _____ asistir a la capacitación.', exp: 'Completa la frase', opts: null, ans: 'deben', ord: 38},
      {type: 'fill_blank', text: 'El informe fue enviado _____ correo electrónico.', exp: 'Completa la frase', opts: null, ans: 'por', ord: 39},
      {type: 'fill_blank', text: 'Necesitamos _____ resultados.', exp: 'Completa la frase', opts: null, ans: 'mejores', ord: 40},
      {type: 'fill_blank', text: '_____ terminemos, enviaremos el reporte.', exp: 'Completa la frase', opts: null, ans: 'Cuando', ord: 41},
      {type: 'fill_blank', text: 'El cliente pidió _____ ayuda.', exp: 'Completa la frase', opts: null, ans: 'más', ord: 42},
      {type: 'fill_blank', text: 'No _____ ningún problema.', exp: 'Completa la frase', opts: null, ans: 'hubo', ord: 43},
      {type: 'fill_blank', text: 'La información está _____.', exp: 'Completa la frase', opts: null, ans: 'completa', ord: 44},
      {type: 'fill_blank', text: 'El equipo logró _____ objetivo.', exp: 'Completa la frase', opts: null, ans: 'su', ord: 45},

      // Identificación de errores (46-50)
      {type: 'identify_error', text: '¿Cuál oración contiene un error? A) El cliente llamó temprano. B) El asesor respondió correctamente. C) Hubieron varios reclamos. D) La llamada fue grabada.', exp: 'Identifica el error gramatical', opts: null, ans: 'C', ord: 46},
      {type: 'identify_error', text: '¿Cuál palabra está mal escrita? A) Capacitación B) Productividad C) Eficiensia D) Organización', exp: 'Identifica la palabra incorrecta', opts: null, ans: 'C', ord: 47},
      {type: 'identify_error', text: '¿Cuál oración tiene un error gramatical? A) Nosotros fuimos al trabajo. B) Ella llegó temprano. C) Yo sabo la respuesta. D) Ellos terminaron la tarea.', exp: 'Busca el error gramatical', opts: null, ans: 'C', ord: 48},
      {type: 'identify_error', text: '¿Cuál opción está mal escrita? A) Decisión B) Solución C) Recepción D) Solucsión', exp: 'Encuentra la opción incorrecta', opts: null, ans: 'D', ord: 49},
      {type: 'identify_error', text: '¿Cuál oración está mejor redactada? A) El cliente llamó y resolvimos su consulta en la primera llamada. B) El cliente llamó resolvimos consulta primera. C) Cliente llamó consulta resolver. D) Llamó cliente resolver consulta.', exp: 'Elige la mejor redacción', opts: null, ans: 'A', ord: 50},
    ];

    console.log('🔄 Insertando 50 preguntas...');
    let count = 0;
    for (const q of questions) {
      await conn.query(`
        INSERT INTO spelling_grammar_questions
        (test_id, question_type, question_text, explanation, options, correct_answer, order_number)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT DO NOTHING
      `, [
        testId,
        q.type,
        q.text,
        q.exp,
        q.opts ? JSON.stringify(q.opts) : null,
        q.ans,
        q.ord
      ]);
      count++;
    }
    console.log(`✅ ${count} preguntas insertadas`);

    conn.release();
    console.log('✅ Setup completado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupDatabase();
