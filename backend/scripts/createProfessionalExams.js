const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PmlaFarTlzhWISrNyBgqRbljxEYjmGai@hayabusa.proxy.rlwy.net:10287/railway',
  ssl: { rejectUnauthorized: false }
});

async function createExams() {
  try {
    console.log('🗑️  LIMPIANDO DATOS ANTERIORES...\n');

    // Limpiar datos en orden correcto (por foreign keys)
    await pool.query('DELETE FROM exam_answers');
    await pool.query('DELETE FROM exam_questions');
    await pool.query('DELETE FROM question_options');
    await pool.query('DELETE FROM questions');
    await pool.query('DELETE FROM vacancy_exams');
    await pool.query('DELETE FROM exams');

    console.log('✅ Base de datos limpia\n');

    // Definir los 5 exámenes con preguntas
    const exams = [
      {
        name: 'Test de Comunicación Verbal',
        description: 'Evaluación de habilidades de comunicación clara, efectiva y adaptada al interlocutor',
        time: 45,
        competencyId: 1,
        questions: [
          { q: '¿Cómo explicas un concepto complejo a alguien que no lo entiende?', opts: ['Repito lo mismo más lentamente', 'Uso analogías y ejemplos simples', 'Le digo que lea el manual', 'Cambio de tema'] },
          { q: 'Un cliente te interrumpe constantemente. ¿Qué haces?', opts: ['Le pido que espere a que termine', 'Escucho y anoto sus puntos', 'Me molesto y cuelgo', 'Ignoro sus interrupciones'] },
          { q: '¿Cuál es tu mayor fortaleza en comunicación?', opts: ['Ser breve y directo', 'Adaptar el mensaje al receptor', 'Hablar sin pausas', 'Usar palabras técnicas'] },
          { q: 'Necesitas transmitir malas noticias. ¿Cómo lo haces?', opts: ['Lo digo rápido para terminar', 'Explico el contexto y el impacto', 'Mando un email', 'Delego en otro'] },
          { q: '¿Cómo sabes si tu mensaje fue entendido?', opts: ['Asumo que entendió', 'Pido feedback y aclaró dudas', 'Espero comentarios', 'No importa si entiende'] },
          { q: 'En una reunión, ¿cuál es tu rol?', opts: ['Hablar todo el tiempo', 'Escuchar y aportar cuando es relevante', 'No participar', 'Criticar las ideas de otros'] },
          { q: '¿Cómo adaptas tu lenguaje a diferentes públicos?', opts: ['Siempre igual', 'Ajusto complejidad y tono según el receptor', 'Depende del día', 'No es necesario'] },
          { q: 'Un cliente dice "no entiendo". ¿Qué significa?', opts: ['Que es tonto', 'Que mi explicación no fue clara', 'Que no prestaba atención', 'Que necesita más tiempo'] },
          { q: '¿Cómo mantienes la claridad bajo presión?', opts: ['Hablo más rápido', 'Pauso, respiro y comunico con orden', 'Me pongo nervioso', 'Repito información'] },
          { q: '¿Cuál es el objetivo de la comunicación?', opts: ['Hablar mucho', 'Que el otro entienda y actúe', 'Ganar la discusión', 'Llenar silencio'] },
          { q: 'Recibes feedback negativo. ¿Cómo respondes?', opts: ['Me enojo', 'Escucho, pregunto y mejoro', 'Lo ignoro', 'Me disculpo sin entender'] },
          { q: '¿Cómo estructuras una presentación importante?', opts: ['Sin plan', 'Inicio, contenido clave, conclusión clara', 'Solo hablo', 'Lo que venga'] },
          { q: '¿Qué rol juega el tono de voz en la comunicación?', opts: ['Ninguno', 'Transmite emoción y intención', 'Solo el contenido importa', 'Es lo menos importante'] },
          { q: '¿Cómo comunicas desacuerdo sin ofender?', opts: ['Critico directamente', 'Reconozco su punto, expongo el mío, busco solución', 'No digo nada', 'Hablo mal de él después'] },
          { q: '¿Cuándo preguntas en lugar de afirmar?', opts: ['Nunca', 'Cuando quiero entender o involucrar', 'Solo cuando dudo', 'Siempre'] },
          { q: '¿Cómo mantienes la confidencialidad en conversaciones?', opts: ['Cuento todo a todos', 'Evalúo qué compartir y con quién', 'No es mi responsabilidad', 'Publico en redes'] },
          { q: '¿Qué hace un comunicador efectivo?', opts: ['Hablar bien', 'Escuchar bien, adaptarse, verificar comprensión', 'Tener buena voz', 'Ser agresivo'] },
          { q: '¿Cómo usas el silencio en la comunicación?', opts: ['Lo evito', 'Lo uso para énfasis y permitir reflexión', 'Me incomoda', 'No existe'] },
          { q: '¿Cómo comunicas límites profesionales?', opts: ['No establezco límites', 'Comunico claramente qué puedo y no puedo', 'Dejo que asuman', 'Cambio según el humor'] },
          { q: '¿Cuál es el impacto de la claridad en resultados?', opts: ['Ninguno', 'Directo - más claro, mejor resultado', 'Poco importante', 'Depende del suerte'] },
          { q: '¿Cómo manejas comunicaciones asincrónicas (email, chat)?', opts: ['Respondo al azar', 'Claro, conciso, estructurado, con seguimiento', 'Muy corto sin contexto', 'Larguísimo y confuso'] },
          { q: '¿Qué preguntas haces para comunicar efectivamente?', opts: ['Pocas', '¿Entendiste? ¿Alguna pregunta? ¿Cómo lo ves?', 'Ninguna', 'Preguntas que juzgan'] },
          { q: '¿Cómo comunicas logros sin parecer arrogante?', opts: ['No los comunico', 'Reconozco contexto y contribuciones de otros', 'Alardeo', 'Espero que otros lo digan'] },
          { q: '¿Cuál es la diferencia entre oír y escuchar?', opts: ['No hay', 'Oír es pasivo, escuchar es activo e intencional', 'Son iguales', 'Oír es mejor'] },
          { q: '¿Cómo comunicas cambios o malas decisiones?', opts: ['Lo escondo', 'Explico qué cambió, por qué, y el impacto', 'Culpo a otros', 'Espero que se enteren solos'] },
          { q: '¿Qué hace que alguien confíe en tu comunicación?', opts: ['Que hables mucho', 'Consistencia, honestidad, claridad', 'Que parezcas seguro', 'Que siempre estés de acuerdo'] },
          { q: '¿Cómo comunicas con personas que no comparten tu idioma?', opts: ['Hablo más fuerte', 'Simpler, visual, verificando comprensión', 'No intento', 'Asumo que entienden'] },
          { q: '¿Cuál es la comunicación más subestimada?', opts: ['Hablar', 'Escuchar sin interrumpir', 'Escribir', 'Gesticular'] },
          { q: '¿Cómo comunicas urgencia sin crear pánico?', opts: ['Grito', 'Comunico claramente qué, cuándo, por qué, acción', 'No comunico nada', 'Exagero'] },
          { q: '¿Qué mejora más la comunicación en equipo?', opts: ['Menos reuniones', 'Claridad, frecuencia, escucha activa', 'Más emails', 'Menos interacción'] },
          { q: '¿Cómo comunicas tu disponibilidad y tiempos?', opts: ['Cambio sin avisar', 'Comunico horarios, respuesta, expectativas', 'No importa', 'Ignoro mensajes'] },
          { q: '¿Cuándo debe ser sincrónica la comunicación?', opts: ['Nunca', 'Temas complejos, emotivos o urgentes', 'Siempre', 'Cuando me apetece'] },
          { q: '¿Cómo comunicas aprendizajes o errores?', opts: ['Los escondo', 'Reconozco, explico qué aprendí, cómo mejoro', 'Culpo', 'Finjo que no pasó'] },
          { q: '¿Qué habilidad de comunicación desarrollarías primero?', opts: ['Hablar más', 'Escuchar con comprensión real', 'Usar más palabras', 'No desarrollaría'] }
        ]
      },
      {
        name: 'Test de Escucha Activa',
        description: 'Evaluación de la capacidad de escuchar, comprender e integrar información del interlocutor',
        time: 45,
        competencyId: 2,
        questions: [
          { q: '¿Qué es escucha activa?', opts: ['Escuchar sin interrumpir', 'Entender, retener y responder al mensaje', 'Estar callado', 'Fingir que escuchas'] },
          { q: '¿Qué haces mientras alguien habla?', opts: ['Pienso en mi respuesta', 'Me enfoco en entender su punto', 'Miro el celular', 'Interruplo cuando puedo'] },
          { q: '¿Cómo verificas que entendiste?', opts: ['Asumo que sí', 'Parafraseo o pregunto para confirmar', 'No verifico', 'Solo digo que entiendo'] },
          { q: 'Alguien cuenta un problema. ¿Tu primer instinto es?', opts: ['Dar consejo inmediato', 'Entender completamente antes de sugerir', 'Cambiar de tema', 'Hablar de mi problema'] },
          { q: '¿Cómo mantienes contacto visual mientras escuchas?', opts: ['No lo hago', 'Natural, demostrando interés', 'Fijo e incómodo', 'Evitándolo'] },
          { q: '¿Qué significa "retener información"?', opts: ['No se olvida al día siguiente', 'Captura puntos clave y contexto', 'Solo palabras exactas', 'No importa'] },
          { q: '¿Cómo respondes a un relato emocional?', opts: ['Con lógica fría', 'Reconozco la emoción antes de sugerir', 'Me rio', 'Cambio de tema'] },
          { q: '¿Cuál es el error más común en escucha?', opts: ['Estar en silencio', 'Planear respuesta mientras el otro habla', 'Estar atento', 'Preguntar'] },
          { q: '¿Cómo señalizas que estás escuchando?', opts: ['Nada, solo espero', 'Asiento, hago contacto visual, pequeños "mm"', 'Miro mi reloj', 'Miro otro lado'] },
          { q: '¿Qué es "presencia" en escucha?', opts: ['Estar en el lugar', 'Estar mental y emocionalmente disponible', 'Estar físicamente', 'Cualquier cosa'] },
          { q: 'Si alguien se repite, ¿qué haces?', opts: ['Le digo que ya lo oí', 'Escucho nuevamente, tal vez enfatiza algo importante', 'Me voy', 'Interrumpo'] },
          { q: '¿Cómo escuchas a alguien que no te cae bien?', opts: ['No escucho bien', 'Con la misma atención, separando persona de mensaje', 'Escucho mal a propósito', 'No escucho'] },
          { q: '¿Cuál es el silencio en escucha activa?', opts: ['Incómodo', 'Espacio para que el otro complete', 'Negativo', 'Aburrido'] },
          { q: '¿Cómo manejas distracciones mientras escuchas?', opts: ['Las ignoro', 'Las reconozco y me refoco', 'Les doy atención', 'Es imposible'] },
          { q: '¿Qué preguntas hace un escuchador activo?', opts: ['Ninguna', 'Aclaratorias que profundizan comprensión', 'Muchas al azar', 'Preguntas que juzgan'] },
          { q: '¿Cómo escuchas en modo multitarea?', opts: ['Perfectamente', 'Mal, debo enfocarse', 'Muy bien', 'Es lo mejor'] },
          { q: '¿Qué diferencia hay entre simpatía y escucha activa?', opts: ['Nada', 'Simpatía siente, escucha entiende sin juzgar', 'Es lo mismo', 'No hay'] },
          { q: '¿Cómo responde el escuchador activo?', opts: ['De inmediato', 'Tras entender completamente', 'Sin pensar', 'Con crítica'] },
          { q: '¿Cuándo dejas de escuchar en una conversación?', opts: ['Cuando me aburro', 'Rara vez, mantengo atención', 'Enseguida', 'Desde el inicio'] },
          { q: '¿Qué impacto tiene escuchar bien en relaciones?', opts: ['Ninguno', 'Genera confianza, cercanía, entendimiento', 'Negativo', 'Poco'] },
          { q: '¿Cómo escuchas feedback crítico?', opts: ['A la defensiva', 'Con apertura, buscando mejorar', 'Enojado', 'No lo escucho'] },
          { q: '¿Qué haces con información que escuchas?', opts: ['La olvido', 'La retengo y uso cuando es relevante', 'La comparto sin permiso', 'La pierdo'] },
          { q: '¿Cómo reconoces si alguien te escucha realmente?', opts: ['Dice que sí', 'Hace preguntas pertinentes y parafrasea', 'Está callado', 'Mira el teléfono'] },
          { q: '¿Cuál es la barrera más grande para escuchar?', opts: ['Silencio', 'Ego y necesidad de hablar', 'Tiempo', 'El otro'] },
          { q: '¿Cómo escuchas a alguien muy diferente a ti?', opts: ['Con dificultad', 'Con curiosidad genuina por perspectiva', 'No puedo', 'Imparcialmente'] },
          { q: '¿Qué es "escucha empática"?', opts: ['No interrumpir', 'Entender emoción, perspectiva y necesidad', 'Llorar', 'Estar de acuerdo'] },
          { q: '¿Cómo evitas juzgar mientras escuchas?', opts: ['Es imposible', 'Separo la persona del comportamiento', 'Siempre juzgo', 'Judging está bien'] },
          { q: '¿Qué hace que alguien se sienta escuchado?', opts: ['Silencio incómodo', 'Atención completa, validación, comprensión', 'Rapidez', 'Estar en el teléfono'] },
          { q: '¿Cuándo es más importante escuchar?', opts: ['Nunca', 'En conflictos, cambios, momentos delicados', 'Cuando me aburro', 'Depende'] },
          { q: '¿Cómo mejorar escucha activa?', opts: ['Practicar', 'Practicar, pedir feedback, reflexionar', 'Leer', 'No se puede mejorar'] }
        ]
      },
      {
        name: 'Test de Empatía',
        description: 'Evaluación de la capacidad de entender y responder emocionalmente a las necesidades de otros',
        time: 45,
        competencyId: 6,
        questions: [
          { q: '¿Qué es empatía?', opts: ['Estar de acuerdo', 'Entender y compartir emoción del otro', 'Sentir lástima', 'Resolver el problema'] },
          { q: 'Alguien está triste. ¿Qué haces?', opts: ['Ignoro su emoción', 'Reconozco su dolor y estoy presente', 'Me voy', 'Lo critiqué'] },
          { q: '¿Cómo demuestras empatía sin palabras?', opts: ['Nada', 'Contacto visual, gesto, presencia', 'Alejándome', 'Riendo'] },
          { q: '¿Cuál es la diferencia entre simpatía y empatía?', opts: ['Son iguales', 'Simpatía siente POR, empatía siente CON', 'No hay diferencia', 'Simpatía es mejor'] },
          { q: 'Alguien comete error y se siente mal. ¿Qué dices?', opts: ['Te lo advertí', 'Entiendo que es difícil, estoy aquí', 'Es tu culpa', 'Nada'] },
          { q: '¿Cómo responde un empático a ira ajena?', opts: ['Con más ira', 'Reconociendo frustración sin personalizarlo', 'Escapando', 'Ignorando'] },
          { q: '¿Qué freno tiene la empatía excesiva?', opts: ['Ninguno', 'Perder objetividad y cuidar tu bienestar', 'Todo', 'Los otros'] },
          { q: '¿Cómo entiendes la perspectiva del otro?', opts: ['Asumo que es igual a la mía', 'Pregunto y trato de ver desde su punto', 'No me importa', 'Ignoro'] },
          { q: 'Ante despedida o cambio, ¿qué reconoces?', opts: ['Solo hechos', 'Emoción, incertidumbre, oportunidad', 'Que se vaya', 'Nada'] },
          { q: '¿Cómo demuestras interés genuino en otros?', opts: ['Fingiendo', 'Preguntando, recordando detalles, mostrando cuidado', 'No intereso', 'Mínimamente'] },
          { q: '¿Qué es "validación emocional"?', opts: ['Agreeing siempre', 'Reconocer sentimiento como real y legítimo', 'No deben sentirse', 'Minimizar'] },
          { q: '¿Cómo manejas emociones ajenas intensas?', opts: ['Evito', 'Estoy presente sin absorber su emoción', 'Me abruman', 'Huyo'] },
          { q: '¿Cuándo es más importante empatía?', opts: ['Nunca', 'En conflictos, pérdidas, vulnerabilidad', 'En alegría', 'No importa'] },
          { q: 'Alguien está asustado. ¿Qué transmites?', opts: ['Más miedo', 'Calma y seguridad sin minimizar su miedo', 'Rechazo', 'Indiferencia'] },
          { q: '¿Cómo reconoces emociones no verbalizadas?', opts: ['No puedo', 'Observo gestos, tono, cambios de humor', 'Asumo', 'Las ignoro'] },
          { q: '¿Qué impacto tiene empatía en confianza?', opts: ['Ninguno', 'Genera seguridad y apertura', 'Negativo', 'Poco'] },
          { q: '¿Cómo responds a culpa ajena?', opts: ['La culpo más', 'Reconozco remordimiento y apoyo', 'Me desvinculo', 'La juzgo'] },
          { q: '¿Cuál es el límite de responsabilidad empática?', opts: ['Todos', 'Entiendo pero no cargo emocionalmente', 'Ninguno', 'Demasiado'] },
          { q: '¿Cómo demuestras empatía en desacuerdo?', opts: ['Ignorando su perspectiva', 'Respetando su punto aunque no esté de acuerdo', 'Siendo agresivo', 'No intento'] },
          { q: '¿Qué hace sentir "entendido" a alguien?', opts: ['Silencio', 'Que captes su emoción, necesidad y perspectiva', 'Soluciones rápidas', 'Consejos'] },
          { q: '¿Cómo cultivas empatía si no la sientes naturalmente?', opts: ['No se puede', 'Practicando, cuestionando, exponiendo perspectivas', 'Fingiendo', 'Forzando'] },
          { q: 'Ante fracaso ajeno, ¿qué reconoces?', opts: ['Solo fracaso', 'Dolor, aprendizaje, oportunidad', 'Debilidad', 'Error'] },
          { q: '¿Cómo evitas proyectar tu emoción en otros?', opts: ['Es imposible', 'Reconociendo mis emociones antes de responder', 'No lo evito', 'Siempre lo hago'] },
          { q: '¿Cuándo la empatía es contraproducente?', opts: ['Nunca', 'Cuando impide honestidad o accountability', 'En negocios', 'Rara vez'] },
          { q: '¿Cómo comunicas empatía en crisis?', opts: ['Con optimismo forzado', 'Presencia, reconocimiento, acción si puedo ayudar', 'Escapando', 'Mínimamente'] },
          { q: '¿Qué diferencia hay entre empatía y acuerdo?', opts: ['Nada', 'Empatía entiende sin necesidad de estar de acuerdo', 'Son iguales', 'No hay'] },
          { q: '¿Cómo manejas cuando tu empatía no alivia?', opts: ['Culpo al otro', 'Reconozco que no todo se resuelve, estoy presente', 'Abandono', 'Desisto'] },
          { q: '¿Cuál es la raíz de la empatía?', opts: ['Lástima', 'Reconocimiento de humanidad compartida', 'Obligación', 'Nada'] },
          { q: '¿Cómo responde el empático a crítica?', opts: ['Con defensa', 'Buscando entender perspectiva sin tomar personalizado', 'Atacando', 'Retirándose'] },
          { q: '¿Qué necesita el mundo más: empatía o justicia?', opts: ['Solo justicia', 'Ambas integradas', 'Solo empatía', 'Verdad'] }
        ]
      },
      {
        name: 'Test de Manejo de Objeciones',
        description: 'Evaluación de la capacidad de entender, responder y resolver objeciones del cliente',
        time: 40,
        competencyId: 4,
        questions: [
          { q: '¿Qué es una objeción?', opts: ['Un problema', 'Una oportunidad para entender y demostrar valor', 'Un "no"', 'Una falta de interés'] },
          { q: '¿Cuál es tu primera reacción ante objeción?', opts: ['Defenderme', 'Escuchar para entender la raíz', 'Insistir', 'Aceptar y irme'] },
          { q: '¿Cómo diferencias objeción real de excusa?', opts: ['Asumo', 'Hago preguntas aclaratorias', 'No diferencio', 'Todas son iguales'] },
          { q: '"Es muy caro". ¿Cómo respondes?', opts: ['Bajo precio', 'Entiendo, ¿qué representa valor para ti?', 'Es el mejor precio', 'Lo siento'] },
          { q: '¿Qué hay detrás de toda objeción?', opts: ['Mala fe', 'Miedo, duda o falta de comprensión', 'Incompetencia', 'Nada'] },
          { q: '¿Cómo validas una objeción sin estar de acuerdo?', opts: ['Tengo que estar de acuerdo', 'Reconozco su perspectiva y exploro juntos', 'La rechazo', 'Ignoro'] },
          { q: '"No tengo tiempo". ¿Qué preguntas?', opts: ['Ninguna', 'Entiendo, ¿cuándo podría ser mejor? ¿Qué espera?', 'Hago tiempo', 'Me voy'] },
          { q: '¿Cuál es el error más común ante objeción?', opts: ['Escuchar', 'Vender antes de entender la objeción', 'No insistir', 'Ser agresivo'] },
          { q: '"He tenido mala experiencia". ¿Cómo respondes?', opts: ['Culpo a otros', 'Escucho, valido experiencia, distancio tu solución', 'Es raro', 'Lo siento'] },
          { q: '¿Cómo transformas objeción en conversación?', opts: ['Con agresión', 'Haciendo preguntas que exploren fondo', 'Insistiendo', 'Rendirme'] },
          { q: '"Ya usamos otra solución". ¿Qué haces?', opts: ['Critico la otra', 'Entiendo ventajas/desventajas y propongo comparación', 'Digo que la mía es mejor', 'Me voy'] },
          { q: '¿Cómo manejas objeción sobre ti personalmente?', opts: ['Defensiva', 'Sin tomarla personal, busco entender preocupación', 'Atacando', 'Aceptando sin cuestionar'] },
          { q: '"Necesito pensarlo". ¿Cómo respondes?', opts: ['Ok, adiós', 'Entiendo, ¿qué información te ayudaría? ¿Cuándo hablamos?', 'Insisto ahora', 'Presiono'] },
          { q: '¿Cómo diferencias una objeción de un cierre?', opts: ['No diferencio', 'Objeción es pregunta, cierre es decisión final', 'Son iguales', 'Sin diferencia'] },
          { q: '¿Cuál es el objetivo de manejar objeción?', opts: ['Ganar la discusión', 'Entender y resolver preocupación real', 'Vender a toda costa', 'Callar al otro'] },
          { q: '"No confío en tu empresa". ¿Qué es tu prioridad?', opts: ['Cambiar de tema', 'Entender base de desconfianza y demostrar', 'Culpabilizar', 'Irme'] },
          { q: '¿Cómo usas preguntas para entender objeción?', opts: ['No las uso', 'Pregunto qué, por qué, cómo para profundizar', 'Pregunto retóricas', 'Afirmo'] },
          { q: '¿Cuándo es una objeción insuperable?', opts: ['Siempre', 'Cuando exploras y no hay alineación real', 'Nunca', 'A veces'] },
          { q: '"Estoy satisfecho con mi proveedor". ¿Qué preguntas?', opts: ['Ninguna', 'Entiendo satisfacción, ¿hay áreas de mejora?', 'Critico', 'Me voy'] },
          { q: '¿Cómo evitas sonar defensivo ante objeción?', opts: ['No puedo', 'Escucho completamente, reconozco, exploro', 'Hablo más', 'Critiqué'] },
          { q: '¿Qué impacto tiene manejo de objeciones en relación?', opts: ['Negativo', 'Genera confianza, alineación, soluciones mejores', 'Ninguno', 'Poco'] },
          { q: '"Es demasiado complicado". ¿Qué reconoces?', opts: ['Que es estúpido', 'Que la complejidad es barrera real, simplificar', 'Que se equivoca', 'Que es flojo'] },
          { q: '¿Cómo estructuras respuesta a objeción compleja?', opts: ['Al azar', 'Entiendo, reconozco, ofrezco solución, verifico', 'Improviso', 'Insisto'] },
          { q: '"Habla con mi jefe". ¿Cómo respondes?', opts: ['Me voy', 'Entiendo, ¿puedo explorar contigo primero? ¿Qué espera?', 'Demando jefe', 'Presiono'] },
          { q: '¿Cuándo una objeción es una oportunidad?', opts: ['Nunca', 'Siempre, porque revela preocupación real a resolver', 'A veces', 'Rara vez'] },
          { q: '¿Cómo manejas múltiples objeciones del mismo cliente?', opts: ['Me abruman', 'Las priorizo, abordo una, verifico resolución', 'Abrumen', 'Presiono'] },
          { q: '"No es mi decisión". ¿Qué preguntas?', opts: ['Ninguna', '¿Quién decide? ¿Puedo hablar con ellos? ¿Qué necesitan?', 'Insisto contigo', 'Me voy'] },
          { q: '¿Cómo validas que objeción fue resuelta?', opts: ['Asumo', 'Pregunto si eso resuelve su preocupación', 'Doy por hecho', 'Sigo vendiendo'] },
          { q: '"Tu competencia es más barata". ¿Cómo respondes?', opts: ['Critico competencia', 'Entiendo, ¿qué valora en lo barato? Comparamos valor', 'Bajo precio', 'Me voy'] }
        ]
      },
      {
        name: 'Test de Resolución de Problemas',
        description: 'Evaluación de la capacidad de identificar, analizar y resolver problemas de manera efectiva',
        time: 50,
        competencyId: 4,
        questions: [
          { q: '¿Cuál es el primer paso ante un problema?', opts: ['Dar solución', 'Entender raíz del problema', 'Ignorarlo', 'Culpar'] },
          { q: '¿Qué es la "raíz" de un problema?', opts: ['La causa aparente', 'La causa fundamental subyacente', 'El síntoma', 'El primer error'] },
          { q: '¿Cómo diferencias síntoma de causa?', opts: ['Son iguales', 'Síntoma es observable, causa es razón subyacente', 'No diferencio', 'Usualmente igual'] },
          { q: 'Alguien no cumple plazos. ¿Qué investigas?', opts: ['Capabilidad', 'Comprensión, capacidad, recursos, obstáculos', 'Compromiso', 'Prioridad'] },
          { q: '¿Cuál es el error de resolver síntoma?', opts: ['Nunca es error', 'Problema vuelve porque no atacas causa', 'Es rápido', 'Ahorra tiempo'] },
          { q: '¿Cómo estructuras análisis de problema?', opts: ['Intuitivamente', 'Hechos, contexto, causa, impacto, soluciones posibles', 'Rápidamente', 'Saltando pasos'] },
          { q: '"El servidor está caído". ¿Qué preguntas?', opts: ['Nada, reinicia', 'Cuándo cayó, qué cambió, qué hace exactamente, impacto', 'Cómo cayó', 'Cuándo'] },
          { q: '¿Cuál es la herramienta "5 Porqués"?', opts: ['Cinco preguntas al azar', 'Preguntar "por qué" iterativamente hasta causa raíz', 'Cinco problemas', 'Filosofía'] },
          { q: '¿Cómo evitas asumir en resolución de problemas?', opts: ['No evito', 'Verifico hechos antes de conclusiones', 'Siempre asumo', 'Parcialmente'] },
          { q: '"El cliente está molesto". ¿Cuál es el problema?', opts: ['La molestia', 'La causa de la molestia (espera, solución, comunicación)', 'Que es difícil', 'Su actitud'] },
          { q: '¿Cómo involucras a otros en resolución?', opts: ['Solo yo resuelvo', 'Hago preguntas, incorporo perspectivas, construyo solución juntos', 'Les digo la solución', 'Independientemente'] },
          { q: '"Nada funciona". ¿Qué es verdadero?', opts: ['Literal, nada funciona', 'Contexto específico está fallando, necesito límites', 'Todo falla', 'Es exageración'] },
          { q: '¿Cuál es una solución "temporal" vs "permanente"?', opts: ['La rápida vs lenta', 'Temporal trata síntoma, permanente causa raíz', 'Lo mismo', 'Irrelevante'] },
          { q: '¿Cómo maneja problema complejo con múltiples causas?', opts: ['Enfoco en una', 'Priorizo causas, mapa de dependencias, resuelvo orden', 'Resuelvo todas juntas', 'Abandono'] },
          { q: '"Esto no se puede arreglar". ¿Qué presumes?', opts: ['Es verdad', 'Pregunto si se ha intentado qué, con quién, cuál es límite real', 'Que es imposible', 'Aceptar'] },
          { q: '¿Cómo validar que solución resolvió problema?', opts: ['Asumo', 'Verifico criterio de éxito, monitoreó cambio, confirmo', 'Con el tiempo', 'Espero'] },
          { q: '"Antes esto no pasaba". ¿Qué investigas?', opts: ['La línea de tiempo', '¿Qué cambió? Cuándo ocurrió el cambio y correlación', 'El ambiente', 'El pasado'] },
          { q: '¿Cuál es el riesgo de soluciones rápidas?', opts: ['Ninguno', 'Pueden introducir nuevos problemas, causar deuda técnica', 'Son eficientes', 'Resuelven'] },
          { q: '¿Cómo documenta lecciones de problemas resueltos?', opts: ['No documenta', 'Qué pasó, por qué, solución, cómo prevenir', 'Mentalmente', 'Sobre la marcha'] },
          { q: '"No sé por dónde empezar". ¿Qué ofrece?', opts: ['Desistir', 'Dividir problema en partes, empezar más pequeño, avanzar', 'Es muy difícil', 'Que estudie'] },
          { q: '¿Cómo maneja presión para resolver rápido?', opts: ['Sacrifica calidad', 'Entiende urgencia, balancea velocidad-precisión, comunica', 'Toma el tiempo que toma', 'Es imposible'] },
          { q: '"El problema volverá". ¿Qué significa?', opts: ['Pesimismo', 'Solución no atacó causa, necesita refuerzo', 'Es recurrente', 'Es naturaleza'] },
          { q: '¿Cómo usas histórico en resolución?', opts: ['Lo ignoro', 'Busco patrones, qué se intentó, contexto anterior', 'Siempre es diferente', 'Irrelevante'] },
          { q: '"Hay demasiadas variables". ¿Qué haces?', opts: ['Renuncias', 'Aíslas variables, pruebas sistemáticamente, reduces complejidad', 'Es caótico', 'Esperas'] },
          { q: '¿Cuál es problema "bien definido" vs "mal definido"?', opts: ['Fácil vs difícil', 'Bien: clara causa, límites, solución verificable; Mal: vaga, múltiple', 'Es subjetivo', 'Depende'] },
          { q: '¿Cómo evitas repetir soluciones fallidas?', opts: ['Naturalmente', 'Documento intentos, razón de falla, nuevo approach', 'A veces', 'No se puede'] },
          { q: '"Esto es diferente". ¿Qué significa?', opts: ['No hay analogía', 'Pregunto qué es distinto, qué es análogo, qué aplica', 'Es único', 'Es excusa'] },
          { q: '¿Cuál es impacto de transparencia en resolución?', opts: ['Ninguno', 'Genera confianza, buy-in, soluciones mejores, accountability', 'Ralentiza', 'Distrae'] },
          { q: '"Ya lo intentamos". ¿Qué investigas?', opts: ['Que es imposible', 'Qué se intentó, por qué no funcionó, qué cambió ahora', 'Nueva estrategia', 'Rendirme'] }
        ]
      }
    ];

    console.log('🌱 CREANDO 5 EXÁMENES PROFESIONALES...\n');

    let questionCounter = 0;
    for (const examData of exams) {
      // Crear examen
      const examResult = await pool.query(
        `INSERT INTO exams (name, description, max_time_minutes, type)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [examData.name, examData.description, examData.time, 'professional']
      );

      const examId = examResult.rows[0].id;
      let order = 1;

      // Crear preguntas y opciones
      for (const q of examData.questions) {
        const questionResult = await pool.query(
          `INSERT INTO questions (title, type, competency_id)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [q.q, 'multiple_choice', examData.competencyId]
        );

        const questionId = questionResult.rows[0].id;

        // Crear opciones con scores consistentes (0-100)
        for (let i = 0; i < q.opts.length; i++) {
          const score = i === 1 ? 100 : (i === 0 ? 0 : 20 + (i-1)*20);
          await pool.query(
            `INSERT INTO question_options (question_id, text, score)
             VALUES ($1, $2, $3)`,
            [questionId, q.opts[i], score]
          );
        }

        // Vincular pregunta a examen
        await pool.query(
          `INSERT INTO exam_questions (exam_id, question_id, question_order)
           VALUES ($1, $2, $3)`,
          [examId, questionId, order]
        );

        order++;
        questionCounter++;
      }

      console.log(`✅ ${examData.name}: ${examData.questions.length} preguntas`);
    }

    console.log(`\n🎉 EXÁMENES CREADOS EXITOSAMENTE\n`);
    console.log(`📊 RESUMEN:`);
    console.log(`   Total de exámenes: ${exams.length}`);
    console.log(`   Total de preguntas: ${questionCounter}`);
    console.log(`   Escala de scoring: 0-100 (consistente)`);
    console.log(`   Cálculo: porcentaje = (suma_scores / (preguntas × 100)) × 100\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createExams();
