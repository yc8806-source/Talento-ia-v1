const pool = require('../src/config/database');

async function seedSpellingGrammar() {
  try {
    console.log('🔄 Iniciando seeding de preguntas de Ortografía y Gramática...');

    // 1. Crear test
    const testResult = await pool.query(`
      INSERT INTO spelling_grammar_tests (title, description, difficulty, test_type, duration_seconds, total_questions, language)
      VALUES (
        'Prueba de Ortografía y Gramática',
        'Evaluación de 50 preguntas sobre ortografía, gramática e identificación de errores',
        'medium',
        'mixed',
        1200,
        50,
        'es'
      )
      ON CONFLICT (id) DO NOTHING
      RETURNING id
    `);

    const testId = testResult.rows[0]?.id;
    if (!testId) {
      console.log('ℹ️ Test ya existe');
      const existing = await pool.query(
        "SELECT id FROM spelling_grammar_tests WHERE title = 'Prueba de Ortografía y Gramática' LIMIT 1"
      );
      testId = existing.rows[0].id;
    }

    console.log('✅ Test ID:', testId);

    // 2. Insertar 50 preguntas
    const questions = [
      // Múltiple choice (1-15)
      {type: 'multiple_choice', text: '¿Cuál es la forma correcta de conjugar el verbo "haber" en presente?', explanation: 'El verbo haber se conjuga irregularmente', options: {a:'ha',b:'ave',c:'haya',d:'aya'}, answer: 'a', order: 1},
      {type: 'multiple_choice', text: '¿Cuál de estas palabras está correctamente acentuada?', explanation: 'Solo las palabras agudas terminadas en vocal llevan acento', options: {a:'teléfono',b:'música',c:'crímen',d:'exámen'}, answer: 'a', order: 2},
      {type: 'multiple_choice', text: '¿Qué palabra es un sinónimo de "perplejo"?', explanation: 'Perplejo significa confundido o dudoso', options: {a:'claro',b:'confundido',c:'seguro',d:'alegre'}, answer: 'b', order: 3},
      {type: 'multiple_choice', text: '¿Cuál oración usa correctamente el subjuntivo?', explanation: 'El subjuntivo expresa duda, deseo o condición', options: {a:'Creo que viene mañana',b:'Espero que venga mañana',c:'Vino mañana',d:'Viene mañana'}, answer: 'b', order: 4},
      {type: 'multiple_choice', text: '¿Cuál es la forma correcta del plural de "luz"?', explanation: 'Algunos sustantivos cambian la z por c en plural', options: {a:'luces',b:'luzas',c:'luzes',d:'luz'}, answer: 'a', order: 5},
      {type: 'multiple_choice', text: '¿Qué palabra tiene una b y no una v?', explanation: 'La b se usa en palabras como "haber", "caballo"', options: {a:'civico',b:'actividad',c:'absoluto',d:'negatividad'}, answer: 'c', order: 6},
      {type: 'multiple_choice', text: '¿Cuál es la acentuación correcta de esta palabra?', explanation: 'Las palabras agudas acentúan la última sílaba', options: {a:'rápido',b:'ráipdo',c:'rapído',d:'rápido'}, answer: 'a', order: 7},
      {type: 'multiple_choice', text: '¿Cuál oración tiene puntuación correcta?', explanation: 'Los signos de puntuación son importantes para la claridad', options: {a:'El estudiante, estudió mucho; aprobó el examen',b:'El estudiante estudió mucho y aprobó el examen',c:'El estudiante estudió mucho. aprobó el examen',d:'El estudiante estudió mucho, aprobó examen'}, answer: 'b', order: 8},
      {type: 'multiple_choice', text: '¿Qué palabra se escribe con j?', explanation: 'Hay palabras que usan j en lugar de g', options: {a:'gengible',b:'jengible',c:'jengible',d:'genjible'}, answer: 'b', order: 9},
      {type: 'multiple_choice', text: '¿Cuál es el participio regular del verbo "hablar"?', explanation: 'El participio regular se forma con -ado/-ido', options: {a:'hablando',b:'hablado',c:'hablable',d:'hable'}, answer: 'b', order: 10},
      {type: 'multiple_choice', text: '¿Qué tipo de sustantivo es "mesa"?', explanation: 'Los sustantivos pueden ser propios o comunes', options: {a:'propio',b:'común',c:'derivado',d:'compuesto'}, answer: 'b', order: 11},
      {type: 'multiple_choice', text: '¿Cuál oración usa correctamente "hay/ahí/ay"?', explanation: 'Hay = existencia, Ahí = lugar, Ay = exclamación', options: {a:'Hay que ir ahí',b:'Ay que lindo',c:'Hay personas en ahí',d:'Ahí una persona'}, answer: 'a', order: 12},
      {type: 'multiple_choice', text: '¿Cuál palabra lleva diéresis?', explanation: 'La diéresis (¨) se usa en "ü" en algunas palabras', options: {a:'guano',b:'argüendo',c:'pinguino',d:'aguanieve'}, answer: 'b', order: 13},
      {type: 'multiple_choice', text: '¿Cuál es el adjetivo comparativo de "bueno"?', explanation: 'Los adjetivos comparativos expresan comparación', options: {a:'más bueno',b:'muy bueno',c:'mejor',d:'buenísimo'}, answer: 'c', order: 14},
      {type: 'multiple_choice', text: '¿Qué palabra está correctamente escrita?', explanation: 'Algunas palabras tienen letras silenciosas', options: {a:'psicología',b:'sicología',c:'psicologia',d:'psichosia'}, answer: 'a', order: 15},

      // Llenar espacios (16-35)
      {type: 'fill_blank', text: 'El niño ______ (ir) al parque todos los días.', explanation: 'Conjugación del verbo ir en presente', options: null, answer: 'va', order: 16},
      {type: 'fill_blank', text: '______ importante estudiar para el examen.', explanation: 'Forma impersonal del verbo ser', options: null, answer: 'Es', order: 17},
      {type: 'fill_blank', text: 'La película fue ______ (entretener) e interesante.', explanation: 'Adjetivo que describe la película', options: null, answer: 'entretenida', order: 18},
      {type: 'fill_blank', text: 'Si ______ (tener) dinero, viajaría al extranjero.', explanation: 'Conjugación en condicional', options: null, answer: 'tuviera', order: 19},
      {type: 'fill_blank', text: 'El ______ (profesor) explica la lección claramente.', explanation: 'Sustantivo masculino', options: null, answer: 'profesor', order: 20},
      {type: 'fill_blank', text: '______ no me gusta ese tipo de música.', explanation: 'Pronombre personal', options: null, answer: 'A mí', order: 21},
      {type: 'fill_blank', text: 'Ellos ______ (estar) de vacaciones la próxima semana.', explanation: 'Futuro del verbo estar', options: null, answer: 'estarán', order: 22},
      {type: 'fill_blank', text: 'La ______ (flor) es muy hermosa y colorida.', explanation: 'Sustantivo femenino', options: null, answer: 'flor', order: 23},
      {type: 'fill_blank', text: '______ hemos decidido ir a la playa mañana.', explanation: 'Pronombre plural', options: null, answer: 'Nosotros', order: 24},
      {type: 'fill_blank', text: 'Fue un ______ (suceso) muy importante en su vida.', explanation: 'Sinónimo de evento', options: null, answer: 'suceso', order: 25},
      {type: 'fill_blank', text: 'La ______ (solución) al problema fue muy simple.', explanation: 'Sustantivo femenino', options: null, answer: 'solución', order: 26},
      {type: 'fill_blank', text: '______ vez termina el trabajo, descansa un poco.', explanation: 'Cuando se completa', options: null, answer: 'Cada', order: 27},
      {type: 'fill_blank', text: 'Yo ______ (jugar) fútbol con mis amigos el sábado.', explanation: 'Futuro del verbo jugar', options: null, answer: 'jugaré', order: 28},
      {type: 'fill_blank', text: 'El ______ (artículo) es una parte importante de la oración.', explanation: 'Clase de palabra', options: null, answer: 'artículo', order: 29},
      {type: 'fill_blank', text: '______ escribo esta carta con mucho cuidado.', explanation: 'Indicador de tiempo presente', options: null, answer: 'Hoy', order: 30},
      {type: 'fill_blank', text: 'La ______ (libertad) es un derecho fundamental.', explanation: 'Sustantivo abstracto', options: null, answer: 'libertad', order: 31},
      {type: 'fill_blank', text: 'Ellas ______ (venir) mañana para visitarnos.', explanation: 'Futuro próximo', options: null, answer: 'vienen', order: 32},
      {type: 'fill_blank', text: 'El ______ (gato) duerme sobre el sofá.', explanation: 'Animal doméstico', options: null, answer: 'gato', order: 33},
      {type: 'fill_blank', text: '______ de verdad esto es sorprendente.', explanation: 'Adverbio de verdad', options: null, answer: 'De verdad', order: 34},
      {type: 'fill_blank', text: 'Todos ______ (deber) cumplir con sus responsabilidades.', explanation: 'Verbo modal', options: null, answer: 'deben', order: 35},

      // Identificar errores (36-50)
      {type: 'identify_error', text: 'La estudiante habían llegado temprano. (ERROR: habían)', explanation: 'Debe ser "La estudiante había" (singular)', options: null, answer: 'había', order: 36},
      {type: 'identify_error', text: 'Nosotros fuimos hablando sobre el problema. (ERROR: hablando)', explanation: 'Estructura incorrecta, debería ser "estuvimos hablando"', options: null, answer: 'estuvimos', order: 37},
      {type: 'identify_error', text: 'El profesor no encontró el libro en ningun lugar. (ERROR: ningun)', explanation: 'Debe llevar acento: "ningún"', options: null, answer: 'ningún', order: 38},
      {type: 'identify_error', text: 'Yo voy al cine cada dia sin falta. (ERROR: dia)', explanation: 'Debe llevar acento: "día"', options: null, answer: 'día', order: 39},
      {type: 'identify_error', text: 'Ellos no saben como llegar a la estación. (ERROR: como)', explanation: 'Debe llevar acento cuando es pregunta: "cómo"', options: null, answer: 'cómo', order: 40},
      {type: 'identify_error', text: 'Esta es mi oficina, aquella es de mi jefe. (ERROR: ninguno)', explanation: 'La oración está correcta, no hay error', options: null, answer: 'correcta', order: 41},
      {type: 'identify_error', text: 'Los nenes jugaban en el parque muy feliz. (ERROR: feliz)', explanation: 'Debe concordar en número: "felices"', options: null, answer: 'felices', order: 42},
      {type: 'identify_error', text: 'Me gustaría viajar más a menudo. (ERROR: ninguno)', explanation: 'La oración está correctamente escrita', options: null, answer: 'correcta', order: 43},
      {type: 'identify_error', text: 'Él esta estudiando ingles en la universidad. (ERROR: esta/ingles)', explanation: 'Debe ser "está" y "inglés"', options: null, answer: 'está', order: 44},
      {type: 'identify_error', text: 'La calidad de los productos han mejorado mucho. (ERROR: han)', explanation: 'Debe ser singular: "ha"', options: null, answer: 'ha', order: 45},
      {type: 'identify_error', text: 'Estos libros son más interesantes que aquellos. (ERROR: ninguno)', explanation: 'La oración está correctamente escrita', options: null, answer: 'correcta', order: 46},
      {type: 'identify_error', text: 'Yo creo que tu tienes razón. (ERROR: tu)', explanation: 'Debe llevar acento: "tú"', options: null, answer: 'tú', order: 47},
      {type: 'identify_error', text: 'Si tuviera mas tiempo, terminaría el proyecto. (ERROR: mas)', explanation: 'Debe llevar acento: "más"', options: null, answer: 'más', order: 48},
      {type: 'identify_error', text: 'El administrador de la red ha resuelto el problemas. (ERROR: problemas)', explanation: 'Debe ser singular: "problema"', options: null, answer: 'problema', order: 49},
      {type: 'identify_error', text: 'Los alumnos están preparados para el examen. (ERROR: ninguno)', explanation: 'La oración está completamente correcta', options: null, answer: 'correcta', order: 50},
    ];

    let inserted = 0;
    for (const q of questions) {
      await pool.query(`
        INSERT INTO spelling_grammar_questions
        (test_id, question_type, question_text, explanation, options, correct_answer, order_number)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT DO NOTHING
      `, [
        testId,
        q.type,
        q.text,
        q.explanation,
        q.options ? JSON.stringify(q.options) : null,
        q.answer,
        q.order
      ]);
      inserted++;
    }

    console.log(`✅ ${inserted} preguntas insertadas`);
    console.log('✅ Seeding completado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante seeding:', error);
    process.exit(1);
  }
}

seedSpellingGrammar();
