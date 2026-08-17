require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function seedCorrectedTest() {
  try {
    console.log('🚀 Sembrando Spelling Grammar Test con CORRECCIONES...');

    // Datos corregidos de las 50 preguntas
    const questions = [
      { num: 1, preg: "¿Cuál es la forma correcta de conjugar el verbo \"haber\" en presente?", opts: ["ha","ave","haya","aya"], resp: "ha" },
      { num: 2, preg: "¿Cuál de estas palabras está correctamente acentuada?", opts: ["teléfono","música","crímen","exámen"], resp: "teléfono" },
      { num: 3, preg: "¿Qué palabra es un sinónimo de \"perplejo\"?", opts: ["claro","confundido","directo","obvio"], resp: "confundido" },
      { num: 4, preg: "¿Cuál oración usa correctamente el subjuntivo?", opts: ["Creo que viene mañana","Espero que venga mañana","Vino mañana","Viene mañana"], resp: "Espero que venga mañana" },
      { num: 5, preg: "¿Cuál es la forma correcta del plural de \"luz\"?", opts: ["luces","lucez","luz","lucis"], resp: "luces" },
      { num: 6, preg: "¿Qué palabra tiene una b y no una v?", opts: ["civico","actividad","absoluto","negatividad"], resp: "absoluto" },
      { num: 7, preg: "¿Cuál es la acentuación correcta de esta palabra?", opts: ["rápido","rapido","rápi","raido"], resp: "rápido" },
      { num: 8, preg: "¿Cuál oración tiene puntuación correcta?", opts: ["Hola, ¿cómo estás?","Hola ¿cómo estás","hola como estás","Hola como estás?"], resp: "Hola, ¿cómo estás?" },
      { num: 9, preg: "¿Qué palabra se escribe con j?", opts: ["jota","gato","joven","viejo"], resp: "jota" },
      { num: 10, preg: "¿Cuál es el participio regular del verbo \"hablar\"?", opts: ["hablado","hablando","habla","hablé"], resp: "hablado" },
      { num: 11, preg: "¿Qué tipo de sustantivo es \"mesa\"?", opts: ["propio","común","abstracto","colectivo"], resp: "común" },
      { num: 12, preg: "¿Cuál oración usa correctamente \"hay/ahí/ay\"?", opts: ["Hay una mesa ahí","Ahí muchas mesas","Ay muchas mesas","Hay ahí mesas"], resp: "Hay una mesa ahí" },
      { num: 13, preg: "¿Cuál palabra lleva diéresis?", opts: ["pingüino","guapo","guiso","agua"], resp: "pingüino" },
      { num: 14, preg: "¿Cuál es el adjetivo comparativo de \"bueno\"?", opts: ["buenísimo","mejor","más bueno","buen"], resp: "mejor" },
      { num: 15, preg: "¿Qué palabra está correctamente escrita?", opts: ["psicologia","psicología","siquologia","sicologia"], resp: "psicología" },
      { num: 16, preg: "El niño ______ (ir) al parque todos los días.", opts: ["voy","va","van","iba"], resp: "va" },
      { num: 17, preg: "______ importante estudiar para el examen.", opts: ["Es","Son","Eres","Soy"], resp: "Es" },
      { num: 18, preg: "La película fue ______ (entretener) e interesante.", opts: ["entretenida","entretiene","entreteniendo","entretiene"], resp: "entretenida" },
      { num: 19, preg: "Si ______ (tener) dinero, viajaría al extranjero.", opts: ["tengo","tuviera","tendría","tenía"], resp: "tuviera" },
      { num: 20, preg: "El ______ (profesor) explica la lección claramente.", opts: ["profesor","profesa","profeso","profes"], resp: "profesor" },
      { num: 21, preg: "______ no me gusta ese tipo de música.", opts: ["Te","Me","Le","Se"], resp: "Me" },
      { num: 22, preg: "Ellos ______ (estar) de vacaciones la próxima semana.", opts: ["estoy","está","estarán","estaremos"], resp: "estarán" },
      { num: 23, preg: "La ______ (flor) es muy hermosa y colorida.", opts: ["flor","flora","floración","floresta"], resp: "flor" },
      { num: 24, preg: "______ hemos decidido ir a la playa mañana.", opts: ["Nosotros","Ellos","Ustedes","Yo"], resp: "Nosotros" },
      { num: 25, preg: "Fue un ______ (suceso) muy importante en su vida.", opts: ["evento","suceda","sucesión","sucesivo"], resp: "evento" },
      { num: 26, preg: "La ______ (solución) al problema fue muy simple.", opts: ["solución","soluciona","solucionable","soluto"], resp: "solución" },
      { num: 27, preg: "______ vez termina el trabajo, descansa un poco.", opts: ["Cuando","Donde","Como","Cual"], resp: "Cuando" },
      { num: 28, preg: "Yo ______ (jugar) fútbol con mis amigos el sábado.", opts: ["juego","jugaré","jugaba","he jugado"], resp: "jugaré" },
      { num: 29, preg: "El ______ (artículo) es una parte importante de la oración.", opts: ["artículo","articula","articulista","articulo"], resp: "artículo" },
      { num: 30, preg: "______ escribo esta carta con mucho cuidado.", opts: ["Hoy","Oy","Ai","Hay"], resp: "Hoy" },
      { num: 31, preg: "La ______ (libertad) es un derecho fundamental.", opts: ["libertad","liberal","liberación","libertino"], resp: "libertad" },
      { num: 32, preg: "Ellas ______ (venir) mañana para visitarnos.", opts: ["vienen","vinieron","vendrán","vinieran"], resp: "vendrán" },
      { num: 33, preg: "El ______ (gato) duerme sobre el sofá.", opts: ["gato","gata","gatito","gatuno"], resp: "gato" },
      { num: 34, preg: "______ de verdad esto es sorprendente.", opts: ["De","Da","Do","Di"], resp: "De" },
      { num: 35, preg: "Todos ______ (deber) cumplir con sus responsabilidades.", opts: ["deben","debe","debo","debes"], resp: "deben" },
      { num: 36, preg: "La estudiante habían llegado temprano.", opts: ["Correcto","Debería ser 'había'","Debería ser 'han'","Debería ser 'habían sido'"], resp: "Debería ser 'había'" },
      { num: 37, preg: "Nosotros fuimos hablando sobre el problema.", opts: ["Correcto","Debería ser 'estuvimos hablando'","Debería ser 'hablamos'","Debería ser 'hemos hablado'"], resp: "Debería ser 'estuvimos hablando'" },
      { num: 38, preg: "El profesor no encontró el libro en ningun lugar.", opts: ["Correcto","Debería ser 'ningún'","Debería ser 'ninguém'","Debería ser 'no-uno'"], resp: "Debería ser 'ningún'" },
      { num: 39, preg: "Yo voy al cine cada dia sin falta.", opts: ["Correcto","Debería ser 'día'","Debería ser 'dí'","Debería ser 'diae'"], resp: "Debería ser 'día'" },
      { num: 40, preg: "Ellos no saben como llegar a la estación.", opts: ["Correcto","Debería ser 'cómo'","Debería ser 'coimo'","Debería ser 'come'"], resp: "Debería ser 'cómo'" },
      { num: 41, preg: "Esta es mi oficina, aquella es de mi jefe.", opts: ["Incorrecto","Correcto - sin error","Debería ser 'Esto'","Debería ser 'esa'"], resp: "Correcto - sin error" },
      { num: 42, preg: "Los nenes jugaban en el parque muy feliz.", opts: ["Correcto","Debería ser 'felices'","Debería ser 'felizmente'","Debería ser 'feliza'"], resp: "Debería ser 'felices'" },
      { num: 43, preg: "Me gustaría viajar más a menudo.", opts: ["Incorrecto","Correcto - sin error","Debería ser 'viaje'","Debería ser 'viajar más a veces'"], resp: "Correcto - sin error" },
      { num: 44, preg: "Él esta estudiando ingles en la universidad.", opts: ["Correcto","Debería ser 'está' e 'inglés'","Debería ser 'estás'","Debería ser 'inglish'"], resp: "Debería ser 'está' e 'inglés'" },
      { num: 45, preg: "La calidad de los productos han mejorado mucho.", opts: ["Correcto","Debería ser 'ha'","Debería ser 'hemos'","Debería ser 'habían'"], resp: "Debería ser 'ha'" },
      { num: 46, preg: "Estos libros son más interesantes que aquellos.", opts: ["Incorrecto","Correcto - sin error","Debería ser 'ese'","Debería ser 'esto'"], resp: "Correcto - sin error" },
      { num: 47, preg: "Yo creo que tu tienes razón.", opts: ["Correcto","Debería ser 'tú'","Debería ser 'ti'","Debería ser 'te'"], resp: "Debería ser 'tú'" },
      { num: 48, preg: "Si tuviera mas tiempo, terminaría el proyecto.", opts: ["Correcto","Debería ser 'más'","Debería ser 'maz'","Debería ser 'mas tiempo'"], resp: "Debería ser 'más'" },
      { num: 49, preg: "El administrador de la red ha resuelto el problemas.", opts: ["Correcto","Debería ser 'problema'","Debería ser 'probleme'","Debería ser 'problemático'"], resp: "Debería ser 'problema'" },
      { num: 50, preg: "Los alumnos están preparados para el examen.", opts: ["Incorrecto","Correcto - sin error","Debería ser 'preparando'","Debería ser 'preparados de'"], resp: "Correcto - sin error" }
    ];

    // Crear test
    const testResult = await pool.query(
      `INSERT INTO spelling_grammar_tests
       (id, title, description, difficulty, test_type, language)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [1, 'Ortografía y Gramática', 'Prueba de ortografía y gramática (CORREGIDA)', 'medium', 'multiple_choice', 'es']
    );

    console.log(`✅ Test creado con id: ${testResult.rows[0].id}`);

    // Insertar 50 preguntas corregidas
    for (const q of questions) {
      await pool.query(
        `INSERT INTO spelling_grammar_questions
         (test_id, question_type, question_text, correct_answer, explanation, options, difficulty, order_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          1,
          'multiple_choice',
          q.preg,
          q.resp,
          'Respuesta correcta',
          JSON.stringify({ options: q.opts }),
          'medium',
          q.num
        ]
      );
    }

    console.log(`✅ 50 preguntas CORREGIDAS insertadas exitosamente`);

    // Verificar
    const verification = await pool.query(
      'SELECT COUNT(*) as total FROM spelling_grammar_questions WHERE test_id = 1'
    );

    console.log(`📊 Total de preguntas en BD: ${verification.rows[0].total}`);
    console.log('\n✨ Seeding completado exitosamente');

    if (pool.end) await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (pool.end) await pool.end();
    process.exit(1);
  }
}

seedCorrectedTest();
