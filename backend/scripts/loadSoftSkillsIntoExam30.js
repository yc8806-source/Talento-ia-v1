require('dotenv').config();
const pool = require('../src/config/database');

const softSkillsQuestions = [
  { q: 1, c: 'Comunicación', t: 'Un compañero interpreta mal una instrucción que diste. ¿Qué haces primero?', opts: ['Le indico que debería haber entendido.', 'Aclaro el objetivo, pregunto qué entendió y reformulo la instrucción.', 'Pido a otra persona que se lo explique.', 'Dejo que lo resuelva como pueda.'], ans: 1 },
  { q: 2, c: 'Comunicación', t: 'En una reunión alguien te interrumpe repetidamente. ¿Cómo respondes?', opts: ['Interrumpo también para recuperar la palabra.', 'Me quedo en silencio para evitar conflicto.', 'Mantengo la calma y pido terminar la idea antes de escuchar su punto.', 'Finalizo la reunión.'], ans: 2 },
  { q: 3, c: 'Comunicación', t: 'Debes comunicar una decisión que puede generar resistencia. ¿Cuál es el mejor enfoque?', opts: ['Comunicarla sin explicaciones para evitar debate.', 'Explicar razones, impacto esperado y abrir espacio para preguntas.', 'Enviar un mensaje breve y evitar conversaciones.', 'Esperar a que otros la comuniquen.'], ans: 1 },
  { q: 4, c: 'Comunicación', t: 'Recibes un correo ambiguo de un cliente. ¿Qué haces?', opts: ['Interpreto lo que probablemente quiso decir.', 'Respondo copiando a todo el equipo.', 'Pido aclaración concreta antes de actuar.', 'No respondo hasta que vuelva a escribir.'], ans: 2 },
  { q: 5, c: 'Comunicación', t: 'Cuando das retroalimentación a alguien, lo más efectivo es:', opts: ['Hablar de su personalidad.', 'Señalar hechos concretos, impacto y acordar mejoras.', 'Esperar a la evaluación anual.', 'Decir únicamente lo negativo.'], ans: 1 },
  { q: 6, c: 'Comunicación', t: 'Un colega se muestra a la defensiva ante una observación. ¿Qué haces?', opts: ['Subo el tono para demostrar autoridad.', 'Evito el tema.', 'Escucho su perspectiva y vuelvo a hechos observables.', 'Lo reporto inmediatamente.'], ans: 2 },
  { q: 7, c: 'Comunicación', t: '¿Cuál demuestra escucha activa?', opts: ['Preparar la respuesta mientras la otra persona habla.', 'Mirar el teléfono para tomar notas.', 'Parafrasear lo entendido y hacer preguntas pertinentes.', 'Interrumpir para acelerar la conversación.'], ans: 2 },
  { q: 8, c: 'Comunicación', t: 'En una presentación te hacen una pregunta que no sabes responder.', opts: ['Invento una respuesta convincente.', 'Digo que no tengo el dato y me comprometo a verificarlo.', 'Cambio de tema.', 'Culpo a quien preparó la información.'], ans: 1 },
  { q: 9, c: 'Comunicación', t: 'Cuando necesitas expresar desacuerdo con un superior:', opts: ['Lo contradigo públicamente.', 'No digo nada aunque vea un riesgo.', 'Expongo respetuosamente argumentos, datos y una alternativa.', 'Comento el desacuerdo con compañeros.'], ans: 2 },
  { q: 10, c: 'Comunicación', t: 'Un mensaje urgente requiere coordinación entre varias áreas. ¿Qué haces?', opts: ['Envío un mensaje general sin responsables.', 'Defino objetivo, responsables, plazos y canal de seguimiento.', 'Espero instrucciones de cada área.', 'Resuelvo solo lo que me corresponde.'], ans: 1 },
  { q: 11, c: 'Trabajo en equipo', t: 'Tu equipo tiene un objetivo exigente y una persona está sobrecargada.', opts: ['Le digo que debe organizarse mejor.', 'Ofrezco apoyo y reviso cómo redistribuir tareas sin perder responsabilidades.', 'Hago todo por esa persona.', 'Ignoro la situación.'], ans: 1 },
  { q: 12, c: 'Trabajo en equipo', t: 'Dos compañeros tienen un conflicto que afecta el trabajo.', opts: ['Tomo partido por quien conozco más.', 'Dejo que lo resuelvan solos aunque afecte al equipo.', 'Facilito una conversación centrada en hechos, acuerdos y objetivo común.', 'Informo a todos sobre el conflicto.'], ans: 2 },
  { q: 13, c: 'Trabajo en equipo', t: 'Un integrante recibe reconocimiento por un trabajo al que contribuiste.', opts: ['Reclamo públicamente el mérito.', 'Me alegro por el resultado y converso en privado si necesito aclarar contribuciones.', 'Dejo de colaborar con esa persona.', 'Explico al jefe todo lo que hice.'], ans: 1 },
  { q: 14, c: 'Trabajo en equipo', t: 'El equipo debe tomar una decisión y tu propuesta no es elegida.', opts: ['Me desentiendo de la ejecución.', 'Apoyo el acuerdo y contribuyo a que funcione.', 'Intento demostrar que mi idea era mejor.', 'Espero que fracase.'], ans: 1 },
  { q: 15, c: 'Trabajo en equipo', t: 'Un nuevo integrante comete errores durante su adaptación.', opts: ['Lo excluyo de tareas importantes.', 'Le doy instrucciones claras, feedback y oportunidades para aprender.', 'Hago sus tareas permanentemente.', 'Lo critico frente al equipo.'], ans: 1 },
  { q: 16, c: 'Trabajo en equipo', t: 'Un compañero tiene una fortaleza que complementa tu debilidad.', opts: ['Evito pedir ayuda para parecer competente.', 'Aprovecho la colaboración y también comparto mis fortalezas.', 'Delego todo en esa persona.', 'Compito para demostrar que puedo hacerlo mejor.'], ans: 1 },
  { q: 17, c: 'Trabajo en equipo', t: 'En una reunión alguien propone una idea diferente a la habitual.', opts: ['La descarto por ser poco convencional.', 'Pregunto cómo podría funcionar y evalúo sus méritos.', 'Cambio de tema.', 'Espero que otra persona la critique.'], ans: 1 },
  { q: 18, c: 'Trabajo en equipo', t: 'El éxito de un proyecto depende de varias áreas.', opts: ['Cada área debe resolver lo suyo.', 'Establezco coordinación, dependencias y puntos de seguimiento.', 'Solo coordino cuando aparece un problema.', 'Centralizo todas las decisiones.'], ans: 1 },
  { q: 19, c: 'Trabajo en equipo', t: 'Un compañero te pide ayuda cuando tienes una tarea importante.', opts: ['Siempre digo que sí aunque incumpla mi tarea.', 'Evalúo prioridades y acuerdo una ayuda realista o alternativa.', 'Digo que no sin escuchar.', 'Hago su tarea completa.'], ans: 1 },
  { q: 20, c: 'Trabajo en equipo', t: 'El equipo celebra un resultado positivo.', opts: ['Destaco principalmente mi aporte.', 'Reconozco contribuciones y aprendizajes colectivos.', 'Evito celebrar porque aún hay trabajo.', 'Aprovecho para pedir beneficios personales.'], ans: 1 },
  { q: 21, c: 'Liderazgo', t: 'Tu equipo tiene baja moral. ¿Cuál es tu primer paso?', opts: ['Aumento la carga de trabajo para que demuestren valor.', 'Escucho para entender causas, reconozco avances y ajusto condiciones.', 'Ignoro el problema y espero que mejore solo.', 'Reemplazo a los menos motivados.'], ans: 1 },
  { q: 22, c: 'Liderazgo', t: 'Alguien en tu equipo tiene potencial pero comportamiento disruptivo.', opts: ['Lo despido inmediatamente.', 'Trabajo con desarrollo, claridad en expectativas y consecuencias consistentes.', 'Lo ignoro para evitar conflictos.', 'Lo asigno a otro equipo.'], ans: 1 },
  { q: 23, c: 'Liderazgo', t: 'Necesitas delegar una tarea crítica a alguien inexperto.', opts: ['Hago todo yo para asegurar calidad.', 'Doy capacitación, claridad, acceso a recursos y seguimiento cercano.', 'Solo digo qué hacer y espero resultados.', 'Delego a alguien más experimentado que quizá no tenga tiempo.'], ans: 1 },
  { q: 24, c: 'Liderazgo', t: 'Tu equipo cuestiona una decisión tuya.', opts: ['Impongo la decisión sin explicar.', 'Escucho preocupaciones, reafirmo o ajusto con transparencia.', 'Me ofendo y tomo represalias.', 'Anulo la decisión para evitar conflicto.'], ans: 1 },
  { q: 25, c: 'Liderazgo', t: '¿Qué inspira confianza en un líder?', opts: ['Tomar decisiones rápido sin consultar.', 'Coherencia entre palabras y acciones, transparencia y admitir errores.', 'Ser perfecto y nunca mostrar dudas.', 'Culpar a otros cuando algo falla.'], ans: 1 },
  { q: 26, c: 'Resolución de problemas', t: 'Aparece un problema inesperado en un proyecto. ¿Qué haces?', opts: ['Entro en pánico y culpo a otros.', 'Analizo causas, genero opciones, evalúo riesgos y decido acción.', 'Lo escondo para evitar incómodo.', 'Espero que alguien más lo resuelva.'], ans: 1 },
  { q: 27, c: 'Resolución de problemas', t: 'Alguien en tu equipo tiene un error repetido. ¿Cuál es tu enfoque?', opts: ['Lo regaño para que no vuelva a pasar.', 'Investigas causas (falta habilidad, recursos, claridad) y abordas la raíz.', 'Solo mencionas el error una vez.', 'Lo ignoras para no crear tensión.'], ans: 1 },
  { q: 28, c: 'Resolución de problemas', t: 'Una propuesta tuya genera resistencia. ¿Qué haces?', opts: ['Insisto sin escuchar preocupaciones.', 'Escucho objeciones, ajusto si es válido, comunico claridad si no.', 'Abandono la propuesta.', 'Implemento en secreto.'], ans: 1 },
  { q: 29, c: 'Resolución de problemas', t: '¿Cuál es clave en negociación?', opts: ['Ganar a cualquier costo.', 'Entender intereses de ambos lados y buscar soluciones win-win.', 'Presionar hasta que cedan.', 'Evitar el conflicto total.'], ans: 1 },
  { q: 30, c: 'Resolución de problemas', t: 'Hay desacuerdo sobre un deadline. ¿Cuál es tu rol?', opts: ['Impongo lo que creo correcto.', 'Facilito conversación para entender restricciones reales y alcanzar acuerdo.', 'Evito el tema.', 'Dejo que otros decidan.'], ans: 1 },
  { q: 31, c: 'Adaptabilidad', t: 'Cambia prioridad importante a mitad del proyecto. ¿Cómo reaccionas?', opts: ['Me resisto porque ya empecé.', 'Entiendo razones, replanifíco, comunico impacto y ajusto con agilidad.', 'Ignoro el cambio y sigo adelante.', 'Me frustro y bajo la calidad.'], ans: 1 },
  { q: 32, c: 'Adaptabilidad', t: 'Una herramienta que usas deja de ser disponible. ¿Qué haces?', opts: ['Me quejo indefinidamente.', 'Analizo alternativas, aprendo nueva herramienta y adapto proceso.', 'Espero que vuelva.', 'Paralizo el trabajo.'], ans: 1 },
  { q: 33, c: 'Adaptabilidad', t: '¿Cuál es tu actitud ante feedback crítico?', opts: ['Lo tomo como ataque personal.', 'Escucho para aprender, valido puntos válidos, descarto prejuicios.', 'Lo ignoro completamente.', 'Solo escucho si viene de personas que me caen bien.'], ans: 1 },
  { q: 34, c: 'Adaptabilidad', t: 'Cometes un error que afecta a otros. ¿Cuál es tu primera reacción?', opts: ['Lo niego o culpo a otros.', 'Lo reconozco rápido, pido disculpas y arreglo juntos.', 'Espero a que alguien lo descubra.', 'Lo corrijo en secreto.'], ans: 1 },
  { q: 35, c: 'Adaptabilidad', t: '¿Qué facilita la adaptabilidad en equipo?', opts: ['Rigidez de procesos.', 'Claridad en por qué, flexibilidad en cómo, aprendizaje continuo.', 'Miedo al cambio.', 'Culpa cuando falla.'], ans: 1 },
  { q: 36, c: 'Iniciativa', t: 'Identificas mejora posible pero no es tu responsabilidad directa. ¿Qué haces?', opts: ['Lo callo para no sobrepasar límites.', 'Propongo respetuosamente, ofrezco participar y respeto decisión.', 'Intento implementar sin permiso.', 'Espero instrucción explícita.'], ans: 1 },
  { q: 37, c: 'Iniciativa', t: 'Proyecto aún tiene tiempo pero ves riesgos adelantados. ¿Tu rol?', opts: ['Espero a que otros lo noten.', 'Aviso pronto con propuestas de mitigación, sin alarmar.', 'Solo mencionas riesgos sin soluciones.', 'Ocultas riesgos para evitar sobre-preocupación.'], ans: 1 },
  { q: 38, c: 'Iniciativa', t: 'Tu jefe no te da feedback. ¿Qué haces?', opts: ['Esperas indefinidamente.', 'Solicitas feedback específico y constructivo en momentos adecuados.', 'Te enfadas silenciosamente.', 'Asumes todo es malo.'], ans: 1 },
  { q: 39, c: 'Iniciativa', t: '¿Cuál es diferencia entre iniciativa y sobrepaso de límites?', opts: ['No hay diferencia.', 'Iniciativa: propones mejoras; sobrepaso: ejecutas sin autoridad.', 'Iniciativa es arriesgado.', 'Sobrepaso es siempre malo.'], ans: 1 },
  { q: 40, c: 'Iniciativa', t: 'Tienes una idea innovadora pero arriesgada. ¿Tu enfoque?', opts: ['La rechazas sin probar.', 'La validas con prueba piloto, datos y opciones de reversión.', 'La implementas sin validación.', 'La guardas para siempre.'], ans: 1 },
  { q: 41, c: 'Gestión del tiempo', t: 'Múltiples urgencias simultáneas. ¿Cuál es tu primer paso?', opts: ['Hago todo a la vez.', 'Evalúo impacto real, urgencia verdadera y priorizo racionalmente.', 'Hago lo que otros gritaron primero.', 'Hago nada hasta que se resuelva solo.'], ans: 1 },
  { q: 42, c: 'Gestión del tiempo', t: 'Estimaste mal un tiempo de entrega. ¿Qué haces?', opts: ['Lo ocultas hasta último momento.', 'Informas pronto, explicas causas y propones plan realista.', 'Das un dato completamente diferente.', 'Trabajas días sin dormir.'], ans: 1 },
  { q: 43, c: 'Gestión del tiempo', t: '¿Cuál es mejor estrategia para tareas complejas?', opts: ['Dejar para última hora.', 'Dividir en hitos, empezar temprano, revisar progreso regularmente.', 'Hacer todo en una sola sesión.', 'Esperar inspiración.'], ans: 1 },
  { q: 44, c: 'Gestión del tiempo', t: 'Alguien interrumpe constantemente tu enfoque. ¿Tu límite?', opts: ['Atiende siempre sin protesta.', 'Bloqueas tiempo enfocado, atiende interrupciones en horarios designados.', 'Ignoras a todos.', 'Te enojas con quien interrumpe.'], ans: 1 },
  { q: 45, c: 'Gestión del tiempo', t: '¿Cuál es riesgo de sobrecarga?', opts: ['Ninguno, puedes manejar todo.', 'Calidad baja, errores, estrés, burnout y falta a otros.', 'Solo afecta tu desempeño.', 'Es señal de dedicación.'], ans: 1 },
  { q: 46, c: 'Empatía', t: 'Un compañero comete error grave por estrés personal visible. ¿Tu reacción?', opts: ['Lo castigas sin considerar contexto.', 'Reconoces la dificultad, apoyas resolución, proteges a otros pero con humanidad.', 'Ignoras su contexto.', 'Lo excluyes completamente.'], ans: 1 },
  { q: 47, c: 'Empatía', t: 'Cliente/usuario denuncia problema que te afecta personalmente. ¿Cómo respondes?', opts: ['Tomas defensiva.', 'Separa lo personal, escucha preocupación legítima, abordas profesionalmente.', 'Lo descartas porque te sientes atacado.', 'Prometes lo que no puedes.'], ans: 1 },
  { q: 48, c: 'Empatía', t: '¿Cuál es beneficio de empatía en negociación?', opts: ['Manipular mejor.', 'Entender verdaderas necesidades, encontrar soluciones genuinas.', 'Parecer más amable.', 'Ceder siempre.'], ans: 1 },
  { q: 49, c: 'Empatía', t: 'Colega tiene problema personal que afecta trabajo. ¿Tu rol?', opts: ['Preguntas sin privacidad.', 'Preguntas si desea apoyo, respetas privacidad, conectas con recursos si quiere.', 'Lo ignoras completamente.', 'Lo comentas con otros.'], ans: 1 },
  { q: 50, c: 'Empatía', t: '¿Qué diferencia empatía de comiseración?', opts: ['Son lo mismo.', 'Empatía: entiendes y apoyas; comiseración: lastimas sin resolver.', 'Empatía es debilidad.', 'No hay diferencia relevante.'], ans: 1 },
  { q: 51, c: 'Confiabilidad', t: 'Prometes entrega que ahora ves difícil. ¿Qué haces?', opts: ['Esperas al último momento para avisar.', 'Informas pronto, explicas obstáculos y negocias nuevo plazo o alcance.', 'Das por sentado que no vas a cumplir.', 'Cumples pero con baja calidad.'], ans: 1 },
  { q: 52, c: 'Confiabilidad', t: 'En reunión dice una cosa, luego actúas diferente. Impacto:', opts: ['Ninguno, nadie se da cuenta.', 'Pierdes credibilidad, equipo duda de ti, decisiones se cuestionan.', 'Solo afecta relación con quien lo supo.', 'Es aceptable si el resultado es bueno.'], ans: 1 },
  { q: 53, c: 'Confiabilidad', t: '¿Cuál es clave para ser confiable?', opts: ['Prometer mucho.', 'Ser honesto sobre capacidad, cumplir compromisos, comunicar cambios temprano.', 'Nunca admitir que no sabes.', 'Decir siempre que sí.'], ans: 1 },
  { q: 54, c: 'Confiabilidad', t: 'Alguien confía secreto importante contigo. ¿Cuál es tu responsabilidad?', opts: ['Lo compartes si beneficia tu imagen.', 'Lo guardas a menos que haya riesgo serio; avisa si necesitas compartirlo.', 'Lo cuentas a amigos cercanos.', 'Lo publicas si conviene.'], ans: 1 },
  { q: 55, c: 'Confiabilidad', t: '¿Cómo impacta confiabilidad en equipo?', opts: ['No impacta mucho.', 'Equipos confiables colaboran mejor, enfrentan riesgos juntos, innovan más.', 'Solo afecta relación informal.', 'Es menos importante que las habilidades técnicas.'], ans: 1 },
  { q: 56, c: 'Visión estratégica', t: 'Enfrentas decisión con beneficio corto plazo pero riesgo largo plazo. ¿Enfoque?', opts: ['Tomas beneficio corto plazo.', 'Equilibras corto y largo plazo, comunicas riesgos, busca soluciones sostenibles.', 'Sacrificas todo por largo plazo.', 'Esperas que otros decidan.'], ans: 1 },
  { q: 57, c: 'Visión estratégica', t: '¿Cuál es rol de contexto en decisiones?', opts: ['No importa, usa reglas siempre igual.', 'Contexto es clave: mercado, recursos, stakeholder, timing afectan decisión.', 'Contexto solo importa si es favorable.', 'Mejor ignorar contexto para ser consistente.'], ans: 1 },
  { q: 58, c: 'Visión estratégica', t: 'Tu meta es clara pero paso 1 es confuso. ¿Tu acción?', opts: ['Esperas claridad completa antes de empezar.', 'Aclara meta, aprende en el camino, ajusta ruta según contexto.', 'Haces pasos al azar.', 'Abandonas porque no es perfecto.'], ans: 1 },
  { q: 59, c: 'Visión estratégica', t: 'Cambio de mercado te obliga a replanificar. ¿Tu mentalidad?', opts: ['Te frustra y resistes cambio.', 'Lo ves como oportunidad de ajuste estratégico; replanificas rápido.', 'Ignoras el cambio y sigues igual.', 'Paniqueas sin dirección.'], ans: 1 },
  { q: 60, c: 'Visión estratégica', t: '¿Cómo balanceas flexibilidad con consistencia?', opts: ['Eres rígido siempre.', 'Principios constantes, métodos flexibles según contexto.', 'Cambias todo constantemente.', 'No existe tal balance.'], ans: 1 },
  { q: 61, c: 'Responsabilidad personal', t: 'Tu equipo falla en entrega. Aunque hay factores externos, ¿tu rol?', opts: ['Culpas externos completamente.', 'Reconoces tu parte (supervisión, planificación, recursos) y todos abordan mejora.', 'Culpas a un empleado para salvarte.', 'Ignoras tu responsabilidad.'], ans: 1 },
  { q: 62, c: 'Responsabilidad personal', t: 'Alguien descubre error tuyo. ¿Tu primera reacción?', opts: ['Lo niegas o justificas.', 'Lo reconoces, asumos responsabilidad y corriges juntos.', 'Lo escondes mejor.', 'Culpas a quien lo descubrió.'], ans: 1 },
  { q: 63, c: 'Responsabilidad personal', t: '¿Cuál es diferencia entre excusa y explicación?', opts: ['Son lo mismo.', 'Explicación: contexto honesto; excusa: justificación que evita responsabilidad.', 'Explicación es inaceptable.', 'Excusa es mejor.'], ans: 1 },
  { q: 64, c: 'Responsabilidad personal', t: 'No sabes cómo hacer tarea asignada. ¿Tu acción?', opts: ['Haces mal y esperas que nadie lo note.', 'Pides ayuda/capacitación inmediatamente para hacer bien.', 'Ignoras la tarea.', 'Dices que alguien te enseñe pero nunca confirmas aprendizaje.'], ans: 1 },
  { q: 65, c: 'Responsabilidad personal', t: '¿Cuál es efecto de asumir responsabilidad en confianza?', opts: ['Reduce confianza.', 'Aumenta confianza: demuestras integridad y compromiso.', 'No tiene efecto.', 'Solo importa en ciertos roles.'], ans: 1 },
  { q: 66, c: 'Mentalidad de crecimiento', t: 'Fracasas en meta importante. ¿Tu perspectiva?', opts: ['Eres incompetente y nunca lograrás.', 'Es retroalimentación: qué aprendes y cómo lo intentas diferente.', 'Es culpa de otros o circunstancias.', 'Mejor no volver a intentar.'], ans: 1 },
  { q: 67, c: 'Mentalidad de crecimiento', t: 'Alguien en equipo tiene brecha de habilidad. ¿Tu enfoque?', opts: ['Es fijo, no puede mejorar.', 'Es desarrollable: capacitación, coaching, mentoría aceleran crecimiento.', 'Lo mejor es reemplazarlo.', 'Esperas que aprenda solo.'], ans: 1 },
  { q: 68, c: 'Mentalidad de crecimiento', t: '¿Cuál es rol de feedback en desarrollo?', opts: ['Feedback solo critica.', 'Feedback es herramienta de aprendizaje: señala brecha entre actual e ideal.', 'Mejor evitar feedback.', 'Feedback vale solo si es positivo.'], ans: 1 },
  { q: 69, c: 'Mentalidad de crecimiento', t: 'Ves a colega mejorar en área que antes era débil. ¿Tu reacción?', opts: ['Te molesta que progrese.', 'Te inspira, quizá aprendes de su proceso.', 'Lo descuentas como suerte.', 'Ignoras su mejora.'], ans: 1 },
  { q: 70, c: 'Mentalidad de crecimiento', t: '¿Cuál es ventaja de ver desafíos como oportunidades?', opts: ['Ninguna, son solo obstáculos.', 'Aumenta resiliencia, creatividad, perseverancia y crecimiento real.', 'Hace negar problemas reales.', 'Solo para optimistas.'], ans: 1 },
  { q: 71, c: 'Calidad y excelencia', t: 'Presión de tiempo vs. calidad esperada. ¿Tu balance?', opts: ['Sacrifica siempre calidad por speed.', 'Negocia qué es esencial vs. qué se puede acelerar; comunica compromisos reales.', 'Entrega lento pero perfecta.', 'Entrega mediocre a tiempo.'], ans: 1 },
  { q: 72, c: 'Calidad y excelencia', t: '¿Cuál es rol de estándares en equipo?', opts: ['Demasiado restrictivos.', 'Ofrecen claridad de expectativas, facilita evaluación justa y mejora continua.', 'Mejor sin estándares.', 'Solo importan al principio.'], ans: 1 },
  { q: 73, c: 'Calidad y excelencia', t: 'Identifica error en trabajo casi finalizado. ¿Tiempo de corrección?', opts: ['Lo dejas para la próxima vez.', 'Lo corriges ahora; pequeño delay es mejor que cliente descubra.', 'Esperas que pase desapercibido.', 'Lo corriges pero sin comunicar al cliente.'], ans: 1 },
  { q: 74, c: 'Calidad y excelencia', t: '¿Cuál es diferencia entre "bueno" y "excelencia"?', opts: ['No la hay.', 'Bueno: cumple requisitos; excelencia: anticipa necesidades, detalles, contexto.', 'Excelencia es perfeccionismo tóxico.', 'Excelencia cuesta demasiado.'], ans: 1 },
  { q: 75, c: 'Calidad y excelencia', t: 'Cómo sostienes calidad bajo presión continuada:', opts: ['Es imposible.', 'Priorizas lo crítico, delegas, comunicas límites, proteges equipo.', 'Trabajas más horas.', 'Aceptas baja calidad.'], ans: 1 },
  { q: 76, c: 'Colaboración externa', t: 'Necesitas apoyo de otro departamento pero están ocupados. ¿Enfoque?', opts: ['Esperas indefinidamente.', 'Explicas urgencia, ofreces flexibilidad en timing y colabora en solución.', 'Haces solo lo que puedes.', 'Los presionas.'], ans: 1 },
  { q: 77, c: 'Colaboración externa', t: '¿Cuál es clave para trabajar con equipos externos?', opts: ['Proteger información de tu equipo.', 'Claridad en objetivos comunes, roles, expectativas y comunicación regular.', 'Mantenerlos distantes.', 'Competir internamente.'], ans: 1 },
  { q: 78, c: 'Colaboración externa', t: 'Desacuerdo con socio externo sobre prioridades. ¿Tu rol?', opts: ['Impones tu visión.', 'Negocias con transparencia, busca win-win, escala si hay impase.', 'Evitas el conflicto.', 'Haces lo tuyo ignorándolo.'], ans: 1 },
  { q: 79, c: 'Colaboración externa', t: '¿Cómo impacta cultura en colaboración?', opts: ['Cultura no importa.', 'Culturas diferentes requieren puentes: empatía, explicitud, ajuste mutuo.', 'Mejor trabajar solo con compatibles.', 'Ignorar diferencias.'], ans: 1 },
  { q: 80, c: 'Colaboración externa', t: 'Cliente pide cambio que requiere recursos no presupuestados. ¿Acción?', opts: ['Aceptas sin evaluar impacto.', 'Evalúas impacto, comunicas opciones (costo, timeline, alcance), acuerdas juntos.', 'Lo rechazas sin explicar.', 'Lo haces ocultando el costo real.'], ans: 1 }
];

async function loadSoftSkillsIntoExam30() {
  try {
    console.log('🌱 Cargando 80 preguntas del TEST DE SOFT SKILLS en exam ID 30...\n');

    const examId = 30;

    // Delete existing questions for this exam (if any)
    await pool.query('DELETE FROM question_options WHERE question_id IN (SELECT id FROM questions WHERE exam_id = $1)', [examId]);
    await pool.query('DELETE FROM questions WHERE exam_id = $1', [examId]);
    console.log('Limpiado preguntas anteriores\n');

    let questionCount = 0;
    for (const question of softSkillsQuestions) {
      const qResult = await pool.query(
        'INSERT INTO questions (exam_id, title, type, description) VALUES ($1, $2, $3, $4) RETURNING id',
        [examId, question.t, 'multiple_choice', question.c]
      );

      const questionId = qResult.rows[0].id;

      // Insert options with score
      for (let i = 0; i < question.opts.length; i++) {
        const isCorrect = i === question.ans;
        const score = isCorrect ? 2 : 0;
        await pool.query(
          'INSERT INTO question_options (question_id, text, score, option_order) VALUES ($1, $2, $3, $4)',
          [questionId, question.opts[i], score, i + 1]
        );
      }

      questionCount++;
      if (questionCount % 10 === 0) {
        console.log(`✓ ${questionCount}/80 preguntas`);
      }
    }

    console.log(`\n✅ ¡ÉXITO! Todas las 80 preguntas cargadas en exam ID 30`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

loadSoftSkillsIntoExam30();
