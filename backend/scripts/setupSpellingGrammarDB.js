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

    // 3. Preparar preguntas
    const questions = [
      // Múltiple choice (1-15)
      {type: 'multiple_choice', text: '¿Cuál es la forma correcta de conjugar el verbo "haber" en presente?', exp: 'El verbo haber se conjuga irregularmente', opts: {a:'ha',b:'ave',c:'haya',d:'aya'}, ans: 'a', ord: 1},
      {type: 'multiple_choice', text: '¿Cuál de estas palabras está correctamente acentuada?', exp: 'Solo las palabras agudas terminadas en vocal llevan acento', opts: {a:'teléfono',b:'música',c:'crímen',d:'exámen'}, ans: 'a', ord: 2},
      {type: 'multiple_choice', text: '¿Qué palabra es un sinónimo de "perplejo"?', exp: 'Perplejo significa confundido o dudoso', opts: {a:'claro',b:'confundido',c:'seguro',d:'alegre'}, ans: 'b', ord: 3},
      {type: 'multiple_choice', text: '¿Cuál oración usa correctamente el subjuntivo?', exp: 'El subjuntivo expresa duda, deseo o condición', opts: {a:'Creo que viene mañana',b:'Espero que venga mañana',c:'Vino mañana',d:'Viene mañana'}, ans: 'b', ord: 4},
      {type: 'multiple_choice', text: '¿Cuál es la forma correcta del plural de "luz"?', exp: 'Algunos sustantivos cambian la z por c en plural', opts: {a:'luces',b:'luzas',c:'luzes',d:'luz'}, ans: 'a', ord: 5},
      {type: 'multiple_choice', text: '¿Qué palabra tiene una b y no una v?', exp: 'La b se usa en palabras como "haber", "caballo"', opts: {a:'civico',b:'actividad',c:'absoluto',d:'negatividad'}, ans: 'c', ord: 6},
      {type: 'multiple_choice', text: '¿Cuál es la acentuación correcta de esta palabra?', exp: 'Las palabras agudas acentúan la última sílaba', opts: {a:'rápido',b:'ráipdo',c:'rapído',d:'rápido'}, ans: 'a', ord: 7},
      {type: 'multiple_choice', text: '¿Cuál oración tiene puntuación correcta?', exp: 'Los signos de puntuación son importantes para la claridad', opts: {a:'El estudiante, estudió mucho; aprobó el examen',b:'El estudiante estudió mucho y aprobó el examen',c:'El estudiante estudió mucho. aprobó el examen',d:'El estudiante estudió mucho, aprobó examen'}, ans: 'b', ord: 8},
      {type: 'multiple_choice', text: '¿Qué palabra se escribe con j?', exp: 'Hay palabras que usan j en lugar de g', opts: {a:'gengible',b:'jengible',c:'jengible',d:'genjible'}, ans: 'b', ord: 9},
      {type: 'multiple_choice', text: '¿Cuál es el participio regular del verbo "hablar"?', exp: 'El participio regular se forma con -ado/-ido', opts: {a:'hablando',b:'hablado',c:'hablable',d:'hable'}, ans: 'b', ord: 10},
      {type: 'multiple_choice', text: '¿Qué tipo de sustantivo es "mesa"?', exp: 'Los sustantivos pueden ser propios o comunes', opts: {a:'propio',b:'común',c:'derivado',d:'compuesto'}, ans: 'b', ord: 11},
      {type: 'multiple_choice', text: '¿Cuál oración usa correctamente "hay/ahí/ay"?', exp: 'Hay = existencia, Ahí = lugar, Ay = exclamación', opts: {a:'Hay que ir ahí',b:'Ay que lindo',c:'Hay personas en ahí',d:'Ahí una persona'}, ans: 'a', ord: 12},
      {type: 'multiple_choice', text: '¿Cuál palabra lleva diéresis?', exp: 'La diéresis (¨) se usa en "ü" en algunas palabras', opts: {a:'guano',b:'argüendo',c:'pinguino',d:'aguanieve'}, ans: 'b', ord: 13},
      {type: 'multiple_choice', text: '¿Cuál es el adjetivo comparativo de "bueno"?', exp: 'Los adjetivos comparativos expresan comparación', opts: {a:'más bueno',b:'muy bueno',c:'mejor',d:'buenísimo'}, ans: 'c', ord: 14},
      {type: 'multiple_choice', text: '¿Qué palabra está correctamente escrita?', exp: 'Algunas palabras tienen letras silenciosas', opts: {a:'psicología',b:'sicología',c:'psicologia',d:'psichosia'}, ans: 'a', ord: 15},

      // Llenar espacios (16-35)
      {type: 'fill_blank', text: 'El niño ______ (ir) al parque todos los días.', exp: 'Conjugación del verbo ir en presente', opts: null, ans: 'va', ord: 16},
      {type: 'fill_blank', text: '______ importante estudiar para el examen.', exp: 'Forma impersonal del verbo ser', opts: null, ans: 'Es', ord: 17},
      {type: 'fill_blank', text: 'La película fue ______ (entretener) e interesante.', exp: 'Adjetivo que describe la película', opts: null, ans: 'entretenida', ord: 18},
      {type: 'fill_blank', text: 'Si ______ (tener) dinero, viajaría al extranjero.', exp: 'Conjugación en condicional', opts: null, ans: 'tuviera', ord: 19},
      {type: 'fill_blank', text: 'El ______ (profesor) explica la lección claramente.', exp: 'Sustantivo masculino', opts: null, ans: 'profesor', ord: 20},
      {type: 'fill_blank', text: '______ no me gusta ese tipo de música.', exp: 'Pronombre personal', opts: null, ans: 'A mí', ord: 21},
      {type: 'fill_blank', text: 'Ellos ______ (estar) de vacaciones la próxima semana.', exp: 'Futuro del verbo estar', opts: null, ans: 'estarán', ord: 22},
      {type: 'fill_blank', text: 'La ______ (flor) es muy hermosa y colorida.', exp: 'Sustantivo femenino', opts: null, ans: 'flor', ord: 23},
      {type: 'fill_blank', text: '______ hemos decidido ir a la playa mañana.', exp: 'Pronombre plural', opts: null, ans: 'Nosotros', ord: 24},
      {type: 'fill_blank', text: 'Fue un ______ (suceso) muy importante en su vida.', exp: 'Sinónimo de evento', opts: null, ans: 'suceso', ord: 25},
      {type: 'fill_blank', text: 'La ______ (solución) al problema fue muy simple.', exp: 'Sustantivo femenino', opts: null, ans: 'solución', ord: 26},
      {type: 'fill_blank', text: '______ vez termina el trabajo, descansa un poco.', exp: 'Cuando se completa', opts: null, ans: 'Cada', ord: 27},
      {type: 'fill_blank', text: 'Yo ______ (jugar) fútbol con mis amigos el sábado.', exp: 'Futuro del verbo jugar', opts: null, ans: 'jugaré', ord: 28},
      {type: 'fill_blank', text: 'El ______ (artículo) es una parte importante de la oración.', exp: 'Clase de palabra', opts: null, ans: 'artículo', ord: 29},
      {type: 'fill_blank', text: '______ escribo esta carta con mucho cuidado.', exp: 'Indicador de tiempo presente', opts: null, ans: 'Hoy', ord: 30},
      {type: 'fill_blank', text: 'La ______ (libertad) es un derecho fundamental.', exp: 'Sustantivo abstracto', opts: null, ans: 'libertad', ord: 31},
      {type: 'fill_blank', text: 'Ellas ______ (venir) mañana para visitarnos.', exp: 'Futuro próximo', opts: null, ans: 'vienen', ord: 32},
      {type: 'fill_blank', text: 'El ______ (gato) duerme sobre el sofá.', exp: 'Animal doméstico', opts: null, ans: 'gato', ord: 33},
      {type: 'fill_blank', text: '______ de verdad esto es sorprendente.', exp: 'Adverbio de verdad', opts: null, ans: 'De verdad', ord: 34},
      {type: 'fill_blank', text: 'Todos ______ (deber) cumplir con sus responsabilidades.', exp: 'Verbo modal', opts: null, ans: 'deben', ord: 35},

      // Identificar errores (36-50)
      {type: 'identify_error', text: 'La estudiante habían llegado temprano. (ERROR: habían)', exp: 'Debe ser "La estudiante había" (singular)', opts: null, ans: 'había', ord: 36},
      {type: 'identify_error', text: 'Nosotros fuimos hablando sobre el problema. (ERROR: hablando)', exp: 'Estructura incorrecta, debería ser "estuvimos hablando"', opts: null, ans: 'estuvimos', ord: 37},
      {type: 'identify_error', text: 'El profesor no encontró el libro en ningun lugar. (ERROR: ningun)', exp: 'Debe llevar acento: "ningún"', opts: null, ans: 'ningún', ord: 38},
      {type: 'identify_error', text: 'Yo voy al cine cada dia sin falta. (ERROR: dia)', exp: 'Debe llevar acento: "día"', opts: null, ans: 'día', ord: 39},
      {type: 'identify_error', text: 'Ellos no saben como llegar a la estación. (ERROR: como)', exp: 'Debe llevar acento cuando es pregunta: "cómo"', opts: null, ans: 'cómo', ord: 40},
      {type: 'identify_error', text: 'Esta es mi oficina, aquella es de mi jefe. (ERROR: ninguno)', exp: 'La oración está correcta, no hay error', opts: null, ans: 'correcta', ord: 41},
      {type: 'identify_error', text: 'Los nenes jugaban en el parque muy feliz. (ERROR: feliz)', exp: 'Debe concordar en número: "felices"', opts: null, ans: 'felices', ord: 42},
      {type: 'identify_error', text: 'Me gustaría viajar más a menudo. (ERROR: ninguno)', exp: 'La oración está correctamente escrita', opts: null, ans: 'correcta', ord: 43},
      {type: 'identify_error', text: 'Él esta estudiando ingles en la universidad. (ERROR: esta/ingles)', exp: 'Debe ser "está" y "inglés"', opts: null, ans: 'está', ord: 44},
      {type: 'identify_error', text: 'La calidad de los productos han mejorado mucho. (ERROR: han)', exp: 'Debe ser singular: "ha"', opts: null, ans: 'ha', ord: 45},
      {type: 'identify_error', text: 'Estos libros son más interesantes que aquellos. (ERROR: ninguno)', exp: 'La oración está correctamente escrita', opts: null, ans: 'correcta', ord: 46},
      {type: 'identify_error', text: 'Yo creo que tu tienes razón. (ERROR: tu)', exp: 'Debe llevar acento: "tú"', opts: null, ans: 'tú', ord: 47},
      {type: 'identify_error', text: 'Si tuviera mas tiempo, terminaría el proyecto. (ERROR: mas)', exp: 'Debe llevar acento: "más"', opts: null, ans: 'más', ord: 48},
      {type: 'identify_error', text: 'El administrador de la red ha resuelto el problemas. (ERROR: problemas)', exp: 'Debe ser singular: "problema"', opts: null, ans: 'problema', ord: 49},
      {type: 'identify_error', text: 'Los alumnos están preparados para el examen. (ERROR: ninguno)', exp: 'La oración está completamente correcta', opts: null, ans: 'correcta', ord: 50},
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
