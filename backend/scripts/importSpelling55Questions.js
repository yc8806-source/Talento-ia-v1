require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../src/config/database');

async function importQuestions() {
  try {
    console.log('🚀 Iniciando importación de 55 preguntas nuevas...\n');

    // Las 55 preguntas del archivo Word
    const questions = [
      { num: 1, preg: "¿Cuál palabra está escrita correctamente?", opts: ["Excepción", "Exepción", "Excepciónn", "Ecepción"], resp: "Excepción" },
      { num: 2, preg: "¿Cuál oración usa correctamente la tilde?", opts: ["Él llegó temprano.", "El llegó temprano.", "Él llego temprano.", "El llego temprano."], resp: "Él llegó temprano." },
      { num: 3, preg: "¿Cuál es el plural correcto de «régimen»?", opts: ["Regímenes", "Régimens", "Régimenes", "Regímeneses"], resp: "Regímenes" },
      { num: 4, preg: "¿Cuál palabra debe llevar tilde?", opts: ["Árbol", "Mesa", "Casa", "Papel"], resp: "Árbol" },
      { num: 5, preg: "¿Cuál opción está correctamente escrita?", opts: ["Hervir", "Ervir", "Hervír", "Hervirrr"], resp: "Hervir" },
      { num: 6, preg: "¿Cuál palabra es aguda?", opts: ["Canción", "Árbol", "Lápiz", "Médico"], resp: "Canción" },
      { num: 7, preg: "¿Cuál palabra es grave o llana?", opts: ["Mesa", "Camión", "Café", "Teléfono"], resp: "Mesa" },
      { num: 8, preg: "¿Cuál palabra es esdrújula?", opts: ["Música", "Pared", "Cantar", "Reloj"], resp: "Música" },
      { num: 9, preg: "¿Cuál palabra es sobresdrújula?", opts: ["Dígamelo", "Camino", "Cárcel", "Papel"], resp: "Dígamelo" },
      { num: 10, preg: "¿Cuál oración tiene puntuación correcta?", opts: ["María, ven aquí, por favor.", "María ven aquí por favor.", "María, ven aquí por favor", "María ven aquí, por favor."], resp: "María, ven aquí, por favor." },
      { num: 11, preg: "¿Cuál signo debe cerrar una pregunta?", opts: ["?", "!", ";", ":"], resp: "?" },
      { num: 12, preg: "¿Cuál opción usa correctamente los dos puntos?", opts: ["Necesito tres cosas: pan, leche y huevos.", "Necesito tres cosas, pan: leche y huevos.", "Necesito: tres cosas pan, leche y huevos.", "Necesito tres cosas; pan, leche y huevos."], resp: "Necesito tres cosas: pan, leche y huevos." },
      { num: 13, preg: "¿Cuál oración usa correctamente el punto y coma?", opts: ["Estudié toda la tarde; sin embargo, no terminé.", "Estudié toda la tarde, sin embargo; no terminé.", "Estudié toda la tarde: sin embargo, no terminé.", "Estudié toda la tarde sin embargo; no terminé."], resp: "Estudié toda la tarde; sin embargo, no terminé." },
      { num: 14, preg: "¿Cuál palabra completa correctamente: «No sé ___ no viniste»?", opts: ["por qué", "porque", "porqué", "por que"], resp: "por qué" },
      { num: 15, preg: "¿Cuál palabra completa correctamente: «No fui ___ estaba enferma»?", opts: ["porque", "por qué", "porqué", "por que"], resp: "porque" },
      { num: 16, preg: "¿Cuál opción es correcta?", opts: ["A ver qué sucede.", "Haber qué sucede.", "Aver qué sucede.", "Haber qué susede."], resp: "A ver qué sucede." },
      { num: 17, preg: "¿Cuál oración usa correctamente «hay»?", opts: ["Hay muchas personas aquí.", "Ay muchas personas aquí.", "Ahí muchas personas aquí.", "Hay muchas personas allí."], resp: "Hay muchas personas aquí." },
      { num: 18, preg: "¿Cuál oración usa correctamente «ahí»?", opts: ["El libro está ahí.", "El libro está hay.", "El libro está ay.", "El libro está ahíi."], resp: "El libro está ahí." },
      { num: 19, preg: "¿Cuál expresión es correcta?", opts: ["¡Ay, qué dolor!", "¡Hay, qué dolor!", "¡Ahí, qué dolor!", "¡Ay qué dolór!"], resp: "¡Ay, qué dolor!" },
      { num: 20, preg: "¿Cuál palabra está correctamente escrita?", opts: ["Viajero", "Biagero", "Viajerro", "Viajéro"], resp: "Viajero" },
      { num: 21, preg: "¿Cuál palabra está correctamente escrita?", opts: ["Convivencia", "Convivensia", "Combivencia", "Convivenssia"], resp: "Convivencia" },
      { num: 22, preg: "¿Cuál palabra está correctamente escrita?", opts: ["Necesario", "Nesesario", "Necezario", "Necesareo"], resp: "Necesario" },
      { num: 23, preg: "¿Cuál palabra está correctamente escrita?", opts: ["Decisión", "Desición", "Decizión", "Decicion"], resp: "Decisión" },
      { num: 24, preg: "¿Cuál palabra está correctamente escrita?", opts: ["Precisión", "Presición", "Precisíon", "Precsión"], resp: "Precisión" },
      { num: 25, preg: "¿Cuál palabra está correctamente escrita?", opts: ["Absorber", "Abzorber", "Absorver", "Avsorber"], resp: "Absorber" },
      { num: 26, preg: "¿Cuál palabra está correctamente escrita?", opts: ["Exhausto", "Exausto", "Exhauxto", "Esausto"], resp: "Exhausto" },
      { num: 27, preg: "¿Cuál palabra está correctamente escrita?", opts: ["Transacción", "Transacsión", "Tranzacción", "Transacciónn"], resp: "Transacción" },
      { num: 28, preg: "¿Cuál opción presenta correctamente el verbo «haber»?", opts: ["Ha terminado el trabajo.", "A terminado el trabajo.", "Ah terminado el trabajo.", "Ha terminadó el trabajo."], resp: "Ha terminado el trabajo." },
      { num: 29, preg: "¿Cuál opción presenta correctamente el verbo «hacer»?", opts: ["Hizo la tarea.", "Iso la tarea.", "Hicó la tarea.", "Hizo la taria."], resp: "Hizo la tarea." },
      { num: 30, preg: "¿Cuál oración está correctamente escrita?", opts: ["Hubo muchas personas en la reunión.", "Hubieron muchas personas en la reunión.", "Hubieron muchas personas en la reunión.", "Hubieron muchas personas en la reunión."], resp: "Hubo muchas personas en la reunión." },
      { num: 31, preg: "¿Cuál oración está correctamente escrita?", opts: ["Ella tiene razon.", "Ella tiene razón.", "Ella tienne razón.", "Ella tiene razó."], resp: "Ella tiene razón." },
      { num: 32, preg: "¿Cuál opción es un adjetivo?", opts: ["Hermoso", "Hermosura", "Hermosamente", "Embellecer"], resp: "Hermoso" },
      { num: 33, preg: "¿Cuál palabra es un verbo?", opts: ["Correr", "Corredor", "Corrida", "Corral"], resp: "Correr" },
      { num: 34, preg: "¿Cuál oración tiene concordancia correcta entre sujeto y verbo?", opts: ["El niño come manzanas.", "El niños come manzanas.", "El niño comen manzanas.", "Los niño come manzanas."], resp: "El niño come manzanas." },
      { num: 35, preg: "¿Cuál opción presenta correctamente el adverbio?", opts: ["Ella habla claramente.", "Ella habla claro.", "Ella habla clara.", "Ella habla claradmente."], resp: "Ella habla claramente." },
      { num: 36, preg: "¿Cuál es el adverbio en esta oración: «Llegué rápidamente»?", opts: ["Rápidamente", "llegué", "llegué rápidamente", "ninguno"], resp: "Rápidamente" },
      { num: 37, preg: "¿Cuál pronombre personal completa correctamente: «___ iremos mañana»?", opts: ["Nosotros", "Nos", "Nuestro", "Nuestras"], resp: "Nosotros" },
      { num: 38, preg: "¿Cuál oración usa correctamente el pronombre?", opts: ["Ella me llamó ayer.", "Ella yo llamó ayer.", "Ella mí llamó ayer.", "Ella me llamé ayer."], resp: "Ella me llamó ayer." },
      { num: 39, preg: "¿Cuál es el tiempo verbal de «habíamos terminado»?", opts: ["Pretérito pluscuamperfecto de indicativo", "Pretérito perfecto simple", "Presente de indicativo", "Futuro simple"], resp: "Pretérito pluscuamperfecto de indicativo" },
      { num: 40, preg: "¿Cuál es el tiempo verbal de «comeremos»?", opts: ["Futuro simple", "Presente", "Pretérito imperfecto", "Condicional simple"], resp: "Futuro simple" },
      { num: 41, preg: "¿Cuál oración está en pretérito imperfecto?", opts: ["Cuando era niño, jugaba mucho.", "Ayer jugué mucho.", "Mañana jugaré mucho.", "He jugado mucho."], resp: "Cuando era niño, jugaba mucho." },
      { num: 42, preg: "¿Cuál oración usa correctamente el subjuntivo?", opts: ["Espero que vengas mañana.", "Espero que vienes mañana.", "Espero que vendrás mañana.", "Espero que veniste mañana."], resp: "Espero que vengas mañana." },
      { num: 43, preg: "¿Cuál opción contiene un sustantivo abstracto?", opts: ["Libertad", "Mesa", "Zapato", "Árbol"], resp: "Libertad" },
      { num: 44, preg: "¿Cuál opción contiene un sustantivo colectivo?", opts: ["Rebaño", "Oveja", "Perro", "Casa"], resp: "Rebaño" },
      { num: 45, preg: "¿Cuál palabra es un sinónimo de «rápido»?", opts: ["Veloz", "Lento", "Pesado", "Débil"], resp: "Veloz" },
      { num: 46, preg: "¿Cuál palabra es un antónimo de «abundante»?", opts: ["Escaso", "Numeroso", "Excesivo", "Copioso"], resp: "Escaso" },
      { num: 47, preg: "¿Cuál oración presenta concordancia correcta?", opts: ["Las niñas pequeñas juegan.", "Las niñas pequeño juegan.", "La niñas pequeñas juega.", "Las niña pequeña juegan."], resp: "Las niñas pequeñas juegan." },
      { num: 48, preg: "¿Cuál opción usa correctamente «sino»?", opts: ["No quiero té, sino café.", "No quiero té, si no café.", "No quiero té, sinó café.", "No quiero té sino, café."], resp: "No quiero té, sino café." },
      { num: 49, preg: "¿Cuál opción usa correctamente «también»?", opts: ["Yo también iré.", "Yo tan bien iré.", "Yo tambien iré.", "Yo también iré."], resp: "Yo también iré." },
      { num: 50, preg: "¿Cuál oración está correctamente escrita?", opts: ["Aún no he terminado.", "Aun no he terminado.", "Aún no e terminado.", "Aun no he terminadó."], resp: "Aún no he terminado." },
      { num: 51, preg: "¿Cuál palabra lleva tilde diacrítica en esta oración: «___ quieres, puedes venir»?", opts: ["Si", "Sí", "Sì", "SÍ"], resp: "Sí" },
      { num: 52, preg: "¿Cuál oración usa correctamente «tú»?", opts: ["Tú tienes mi libro.", "Tu tienes mi libro.", "Tú tienes mí libro.", "Tu tienes mí libro."], resp: "Tú tienes mi libro." },
      { num: 53, preg: "¿Cuál opción está correctamente escrita?", opts: ["Asimismo, presentó el informe.", "Así mismo, presentó el informe.", "Asímismo, presentó el informe.", "Asimismo presentó, el informe."], resp: "Asimismo, presentó el informe." },
      { num: 54, preg: "¿Cuál palabra está correctamente escrita?", opts: ["Beneficio", "Veneficio", "Benefisio", "Benefício"], resp: "Beneficio" },
      { num: 55, preg: "¿Cuál oración presenta uso correcto de mayúsculas?", opts: ["La Paz es una ciudad de Bolivia.", "la Paz es una ciudad de Bolivia.", "La paz es una ciudad de Bolivia.", "La Paz es una Ciudad de Bolivia."], resp: "La Paz es una ciudad de Bolivia." }
    ];

    // PASO 1: Eliminar todas las preguntas antiguas
    console.log('🗑️  PASO 1: Eliminando 50 preguntas antiguas...');
    const deleteResult = await pool.query(
      'DELETE FROM spelling_grammar_questions WHERE test_id = 1'
    );
    console.log(`   ✅ Eliminadas ${deleteResult.rowCount} preguntas antiguas\n`);

    // PASO 2: Insertar 55 nuevas preguntas
    console.log('📥 PASO 2: Insertando 55 preguntas nuevas...');
    let inserted = 0;
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
      inserted++;
    }
    console.log(`   ✅ Insertadas ${inserted} preguntas nuevas\n`);

    // PASO 3: Verificar
    const verification = await pool.query(
      'SELECT COUNT(*) as total FROM spelling_grammar_questions WHERE test_id = 1'
    );
    console.log('✨ VERIFICACIÓN:');
    console.log(`   Total de preguntas en BD: ${verification.rows[0].total}`);

    if (verification.rows[0].total === 55) {
      console.log('   ✅ ¡Importación exitosa!\n');
      return true;
    } else {
      console.log('   ❌ Error: El total no coincide\n');
      return false;
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  } finally {
    await pool.end();
  }
}

importQuestions().then(success => {
  process.exit(success ? 0 : 1);
});
