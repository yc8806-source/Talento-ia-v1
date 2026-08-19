require('dotenv').config();
const pool = require('../src/config/database');

// Todas las 80 preguntas - Formato compacto
const questions = [
  {q: 1, c: 'Comunicación', t: 'Un compañero interpreta mal una instrucción que diste. ¿Qué haces primero?', opts: ['Le indico que debería haber entendido.', 'Aclaro el objetivo, pregunto qué entendió y reformulo la instrucción.', 'Pido a otra persona que se lo explique.', 'Dejo que lo resuelva como pueda.'], ans: 1},
  {q: 2, c: 'Comunicación', t: 'En una reunión alguien te interrumpe repetidamente. ¿Cómo respondes?', opts: ['Interrumpo también para recuperar la palabra.', 'Me quedo en silencio para evitar conflicto.', 'Mantengo la calma y pido terminar la idea antes de escuchar su punto.', 'Finalizo la reunión.'], ans: 2},
  {q: 3, c: 'Comunicación', t: 'Debes comunicar una decisión que puede generar resistencia. ¿Cuál es el mejor enfoque?', opts: ['Comunicarla sin explicaciones para evitar debate.', 'Explicar razones, impacto esperado y abrir espacio para preguntas.', 'Enviar un mensaje breve y evitar conversaciones.', 'Esperar a que otros la comuniquen.'], ans: 1},
  {q: 4, c: 'Comunicación', t: 'Recibes un correo ambiguo de un cliente. ¿Qué haces?', opts: ['Interpreto lo que probablemente quiso decir.', 'Respondo copiando a todo el equipo.', 'Pido aclaración concreta antes de actuar.', 'No respondo hasta que vuelva a escribir.'], ans: 2},
  {q: 5, c: 'Comunicación', t: 'Cuando das retroalimentación a alguien, lo más efectivo es:', opts: ['Hablar de su personalidad.', 'Señalar hechos concretos, impacto y acordar mejoras.', 'Esperar a la evaluación anual.', 'Decir únicamente lo negativo.'], ans: 1},
  {q: 6, c: 'Comunicación', t: 'Un colega se muestra a la defensiva ante una observación. ¿Qué haces?', opts: ['Subo el tono para demostrar autoridad.', 'Evito el tema.', 'Escucho su perspectiva y vuelvo a hechos observables.', 'Lo reporto inmediatamente.'], ans: 2},
  {q: 7, c: 'Comunicación', t: '¿Cuál demuestra escucha activa?', opts: ['Preparar la respuesta mientras la otra persona habla.', 'Mirar el teléfono para tomar notas.', 'Parafrasear lo entendido y hacer preguntas pertinentes.', 'Interrumpir para acelerar la conversación.'], ans: 2},
  {q: 8, c: 'Comunicación', t: 'En una presentación te hacen una pregunta que no sabes responder.', opts: ['Invento una respuesta convincente.', 'Digo que no tengo el dato y me comprometo a verificarlo.', 'Cambio de tema.', 'Culpo a quien preparó la información.'], ans: 1},
  {q: 9, c: 'Comunicación', t: 'Cuando necesitas expresar desacuerdo con un superior:', opts: ['Lo contradigo públicamente.', 'No digo nada aunque vea un riesgo.', 'Expongo respetuosamente argumentos, datos y una alternativa.', 'Comento el desacuerdo con compañeros.'], ans: 2},
  {q: 10, c: 'Comunicación', t: 'Un mensaje urgente requiere coordinación entre varias áreas. ¿Qué haces?', opts: ['Envío un mensaje general sin responsables.', 'Defino objetivo, responsables, plazos y canal de seguimiento.', 'Espero instrucciones de cada área.', 'Resuelvo solo lo que me corresponde.'], ans: 1},

  {q: 11, c: 'Trabajo en equipo', t: 'Tu equipo tiene un objetivo exigente y una persona está sobrecargada.', opts: ['Le digo que debe organizarse mejor.', 'Ofrezco apoyo y reviso cómo redistribuir tareas sin perder responsabilidades.', 'Hago todo por esa persona.', 'Ignoro la situación.'], ans: 1},
  {q: 12, c: 'Trabajo en equipo', t: 'Dos compañeros tienen un conflicto que afecta el trabajo.', opts: ['Tomo partido por quien conozco más.', 'Dejo que lo resuelvan solos aunque afecte al equipo.', 'Facilito una conversación centrada en hechos, acuerdos y objetivo común.', 'Informo a todos sobre el conflicto.'], ans: 2},
  {q: 13, c: 'Trabajo en equipo', t: 'Un integrante recibe reconocimiento por un trabajo al que contribuiste.', opts: ['Reclamo públicamente el mérito.', 'Me alegro por el resultado y converso en privado si necesito aclarar contribuciones.', 'Dejo de colaborar con esa persona.', 'Explico al jefe todo lo que hice.'], ans: 1},
  {q: 14, c: 'Trabajo en equipo', t: 'El equipo debe tomar una decisión y tu propuesta no es elegida.', opts: ['Me desentiendo de la ejecución.', 'Apoyo el acuerdo y contribuyo a que funcione.', 'Intento demostrar que mi idea era mejor.', 'Espero que fracase.'], ans: 1},
  {q: 15, c: 'Trabajo en equipo', t: 'Un nuevo integrante comete errores durante su adaptación.', opts: ['Lo excluyo de tareas importantes.', 'Le doy instrucciones claras, feedback y oportunidades para aprender.', 'Hago sus tareas permanentemente.', 'Lo critico frente al equipo.'], ans: 1},
  {q: 16, c: 'Trabajo en equipo', t: 'Un compañero tiene una fortaleza que complementa tu debilidad.', opts: ['Evito pedir ayuda para parecer competente.', 'Aprovecho la colaboración y también comparto mis fortalezas.', 'Delego todo en esa persona.', 'Compito para demostrar que puedo hacerlo mejor.'], ans: 1},
  {q: 17, c: 'Trabajo en equipo', t: 'En una reunión alguien propone una idea diferente a la habitual.', opts: ['La descarto por ser poco convencional.', 'Pregunto cómo podría funcionar y evalúo sus méritos.', 'Cambio de tema.', 'Espero que otra persona la critique.'], ans: 1},
  {q: 18, c: 'Trabajo en equipo', t: 'El éxito de un proyecto depende de varias áreas.', opts: ['Cada área debe resolver lo suyo.', 'Establezco coordinación, dependencias y puntos de seguimiento.', 'Solo coordino cuando aparece un problema.', 'Centralizo todas las decisiones.'], ans: 1},
  {q: 19, c: 'Trabajo en equipo', t: 'Un compañero te pide ayuda cuando tienes una tarea importante.', opts: ['Siempre digo que sí aunque incumpla mi tarea.', 'Evalúo prioridades y acuerdo una ayuda realista o alternativa.', 'Digo que no sin escuchar.', 'Hago su tarea completa.'], ans: 1},
  {q: 20, c: 'Trabajo en equipo', t: 'El equipo celebra un resultado positivo.', opts: ['Destaco principalmente mi aporte.', 'Reconozco contribuciones y aprendizajes colectivos.', 'Evito celebrar porque aún hay trabajo.', 'Aprovecho para pedir beneficios personales.'], ans: 1},

  {q: 21, c: 'Liderazgo', t: 'Un colaborador tiene buen desempeño pero necesita más autonomía.', opts: ['Mantengo control de cada detalle.', 'Defino expectativas y límites y le doy autonomía progresiva.', 'Le entrego todo sin seguimiento.', 'Evito asignarle responsabilidades.'], ans: 1},
  {q: 22, c: 'Liderazgo', t: 'Tu equipo comete un error importante.', opts: ['Busco inmediatamente al culpable.', 'Contengo el impacto, analizo causas y defino acciones preventivas.', 'Oculto el error.', 'Culpo al equipo públicamente.'], ans: 1},
  {q: 23, c: 'Liderazgo', t: 'Un integrante del equipo tiene potencial pero actualmente con bajo rendimiento.', opts: ['Lo saco del equipo inmediatamente.', 'Entiendo causas, desarrollo un plan de mejora y proporciono apoyo.', 'Lo ignoro esperando que mejore por sí solo.', 'Le asigno las tareas menos importantes.'], ans: 1},
  {q: 24, c: 'Liderazgo', t: 'Necesitas implementar un cambio que genera resistencia en el equipo.', opts: ['Lo impongo sin explicar por qué.', 'Explico la necesidad, escucho preocupaciones y defino el camino juntos.', 'Espero a que acepten sin presión.', 'Cambio de estrategia para evitar conflicto.'], ans: 1},
  {q: 25, c: 'Liderazgo', t: 'Un colaborador tiene un problema personal que afecta su trabajo.', opts: ['Lo reprendo por bajo rendimiento.', 'Pregunto si puede afectar su trabajo, ofrezco recursos y apoyo.', 'Ignoro la situación personal.', 'Lo considero una excusa.'], ans: 1},
  {q: 26, c: 'Liderazgo', t: 'Debes tomar una decisión difícil que afectará negativamente a algunos.', opts: ['La tomo sin comunicar.', 'Analizo opciones, comunico razones y apoyo en la transición.', 'Evito la decisión para mantener conformidad.', 'Dejo que otros decidan.'], ans: 1},
  {q: 27, c: 'Liderazgo', t: 'Tu equipo sobrepasa un objetivo importante.', opts: ['Asumo el mérito.', 'Reconozco contribuciones específicas de cada persona.', 'No celebro porque hay más trabajo.', 'Incremento las expectativas sin reconocer el logro.'], ans: 1},
  {q: 28, c: 'Liderazgo', t: 'Un colaborador propone una idea innovadora pero arriesgada.', opts: ['La rechazo por el riesgo.', 'Evalúo el potencial y el riesgo, acordamos un piloto controlado.', 'La apruebo sin análisis.', 'Delego la responsabilidad completamente.'], ans: 1},
  {q: 29, c: 'Liderazgo', t: 'Detectas que un integrante necesita desarrollo en una competencia clave.', opts: ['Lo considero un problema sin solución.', 'Identifico capacitaciones, mentoría y oportunidades para practicar.', 'Espero que se desarrolle solo.', 'Lo cambio de rol para evitar el problema.'], ans: 1},
  {q: 30, c: 'Liderazgo', t: 'Tu equipo está desmotivado por presión y plazos ajustados.', opts: ['Aumento la exigencia para acelerar.', 'Reconozco el esfuerzo, reviso prioridades y busco optimizar procesos.', 'Ignoro el ánimo del equipo.', 'Asumo todas las tareas para aliviar.'], ans: 1},

  {q: 31, c: 'Adaptabilidad', t: 'La empresa cambia una herramienta que utilizas diariamente.', opts: ['Continúo usando la anterior todo lo posible.', 'Aprendo la nueva herramienta y ajusto mi forma de trabajar.', 'Me quejo hasta que vuelva la anterior.', 'Rehúso el cambio.'], ans: 1},
  {q: 32, c: 'Adaptabilidad', t: 'Recibe una asignación diferente a tu área de especialidad.', opts: ['La rechazas porque no es tu rol.', 'Aceptas, buscas aprender y aplicas tu experiencia de forma creativa.', 'La aceptas pero sin entusiasmo.', 'Esperas que alguien más la haga.'], ans: 1},
  {q: 33, c: 'Adaptabilidad', t: 'Un plan que desarrollaste debe cancelarse por cambios estratégicos.', opts: ['Te resistes y presionas por mantenerlo.', 'Aceptas el cambio y enfocas energía en la nueva dirección.', 'Te desanimas completamente.', 'Haces el trabajo anterior de todas formas.'], ans: 1},
  {q: 34, c: 'Adaptabilidad', t: 'Tu equipo se integra con otro departamento con culturas diferentes.', opts: ['Insistes en mantener tus métodos.', 'Conoces su forma de trabajar, identificas lo mejor de ambas y buscas sinergia.', 'Esperas que se adapten completamente a ti.', 'Minimizas la colaboración.'], ans: 1},
  {q: 35, c: 'Adaptabilidad', t: 'Los objetivos del año cambian significativamente a mitad de período.', opts: ['Ignoras el cambio y continúas con el plan original.', 'Realineas esfuerzos, ajusta prioridades y comunica el cambio.', 'Te quejas del cambio constantemente.', 'Esperas que claramente cambios se resuelvan solos.'], ans: 1},
  {q: 36, c: 'Adaptabilidad', t: 'Debes trabajar remotamente de forma permanente (cambio reciente).', opts: ['Resistes y buscas excusas para presenciar.', 'Adaptas tu entorno, rutinas y métodos de comunicación.', 'Trabajas igual que antes sin ajustar.', 'Disminuyes tu rendimiento por la transición.'], ans: 1},
  {q: 37, c: 'Adaptabilidad', t: 'Un cliente solicita una solución que requiere aprender algo nuevo rápido.', opts: ['Rechazas porque no tienes experiencia.', 'Aceptas el desafío, investigas y buscas soluciones creativas.', 'Delays la respuesta indefinidamente.', 'Propones una solución antigua que no es perfecta.'], ans: 1},
  {q: 38, c: 'Adaptabilidad', t: 'Tu rol se expande con nuevas responsabilidades.', opts: ['Te quejas de que es demasiado.', 'Evalúas cómo reorganizar para manejar ambas efectivamente.', 'Haces solo lo que tienes ganas.', 'Esperas que otros compensen.'], ans: 1},
  {q: 39, c: 'Adaptabilidad', t: 'Descubres que tu forma de resolver un problema no es efectiva.', opts: ['Insistes en continuar porque "siempre funcionó".', 'Reconoces el cambio, aprendes una nueva forma y la implementas.', 'Culpas a otros por el fracaso.', 'Abandonas el problema.'], ans: 1},
  {q: 40, c: 'Adaptabilidad', t: 'Un feedback señala que necesitas cambiar tu estilo de comunicación.', opts: ['Defensas y rechazas el feedback.', 'Reflexionas, buscas entender el punto y practicas cambios.', 'Ignoras el feedback.', 'Cambias temporalmente solo cuando hay supervisión.'], ans: 1},

  {q: 41, c: 'Resolución de problemas', t: 'Detectas una caída de productividad. ¿Qué haces primero?', opts: ['Señalo a quienes producen menos.', 'Analizo datos y causas antes de proponer una solución.', 'Cambio inmediatamente el proceso.', 'Asumo que es falta de esfuerzo.'], ans: 1},
  {q: 42, c: 'Resolución de problemas', t: 'Surge un problema inesperado durante un proyecto importante.', opts: ['Panicoeo y paralizo.', 'Reúno información, identifico causa raíz y evalúo opciones.', 'Busco a alguien más para culpar.', 'Espero que se resuelva solo.'], ans: 1},
  {q: 43, c: 'Resolución de problemas', t: 'Un cliente reporta un problema recurrente.', opts: ['Trato cada caso como aislado.', 'Investigo si hay un patrón subyacente y ataco la raíz.', 'Asumo que es culpa del cliente.', 'Ofrezco un parche temporal.'], ans: 1},
  {q: 44, c: 'Resolución de problemas', t: 'Tu solución propuesta genera un nuevo problema.', opts: ['Insistes en que es correcta.', 'Reconoces el efecto secundario y buscas ajustarlo.', 'Culpas a otros por la implementación.', 'Abandonas la solución.'], ans: 1},
  {q: 45, c: 'Resolución de problemas', t: 'Necesitas resolver algo que está fuera de tu expertise.', opts: ['Haces un intento sin buscar ayuda.', 'Busco asesoría, aprendo y resuelvo colaborativamente.', 'Evito porque no es mi responsabilidad.', 'Dejo que se resuelva solo.'], ans: 1},
  {q: 46, c: 'Resolución de problemas', t: 'Tienes múltiples problemas con recursos limitados.', opts: ['Trato todos con igual urgencia.', 'Clasifico por impacto y urgencia, ataco primero lo crítico.', 'Ataco el más fácil primero.', 'Espero instrucciones.'], ans: 1},
  {q: 47, c: 'Resolución de problemas', t: 'Una solución rápida funcionó pero puede tener implicaciones futuras.', opts: ['Continúo con el parche indefinidamente.', 'Evalúo el parche y plan una solución a largo plazo.', 'Ignoro las implicaciones futuras.', 'Reviertes la solución rápida.'], ans: 1},
  {q: 48, c: 'Resolución de problemas', t: 'Dos expertos tiene opiniones opuestas sobre la solución.', opts: ['Tomo la decisión sin escuchar ambas.', 'Escucho ambas perspectivas, busco datos y analizo opciones.', 'Evito decidir para no ofender.', 'Sigo la opinión del más senior.'], ans: 1},
  {q: 49, c: 'Resolución de problemas', t: 'Resuelves un problema pero el cliente no queda conforme.', opts: ['Insistes que la solución es correcta.', 'Investiga la brecha entre lo resuelto y sus expectativas.', 'Ofreces un reembolso sin entender el problema.', 'Culpas al cliente de tener expectativas irreales.'], ans: 1},
  {q: 50, c: 'Resolución de problemas', t: 'Después de resolver un problema, ocurre nuevamente.', opts: ['Asumes que es mala suerte.', 'Revisa si la solución fue incompleta y ataca causas profundas.', 'Aplicas el mismo parche.', 'Escalas el problema sin investigar.'], ans: 1},

  {q: 51, c: 'Inteligencia emocional', t: 'Un cliente se muestra agresivo durante una llamada.', opts: ['Respondo con el mismo tono.', 'Mantengo autocontrol, valido la preocupación y conduzco la conversación.', 'Finalizo inmediatamente.', 'Me tomo personalmente el tono.'], ans: 1},
  {q: 52, c: 'Inteligencia emocional', t: 'Cometes un error delante de tu equipo.', opts: ['Lo defensas o buscas excusas.', 'Lo reconozco, tomo responsabilidad y propongo solución.', 'Culpo a otros.', 'Me avergüenzo y me desconecto.'], ans: 1},
  {q: 53, c: 'Inteligencia emocional', t: 'Un compañero que admiras comete un error grave.', opts: ['Público su error para demostrar que se equivocó.', 'Valido su impacto pero reconozco su trayectoria y converso en privado.', 'Ignoro el error.', 'Pierdo respeto completamente.'], ans: 1},
  {q: 54, c: 'Inteligencia emocional', t: 'Tienes una mala noticia que comunicar a tu equipo.', opts: ['La comunicas abruptamente.', 'Preparo contexto, comunico con empatía y apoyo en la transición.', 'Delay indefinidamente.', 'La comunicas solo a algunos.'], ans: 1},
  {q: 55, c: 'Inteligencia emocional', t: 'Un compañero se muestra emocionalmente afectado en el trabajo.', opts: ['Ignoro la situación.', 'Observo si está bien y pregunto si necesita apoyo o espacio.', 'Lo señalo como improfesional.', 'Asumo que es un problema personal.'], ans: 1},
  {q: 56, c: 'Inteligencia emocional', t: 'Estás frustrado y algo insignificante desata tu enojo.', opts: ['Explotas en el momento.', 'Reconozco que mi nivel de estrés es alto, busco un espacio y vuelvo.', 'Culpo a otros de tu frustración.', 'Trabajas enojado el resto del día.'], ans: 1},
  {q: 57, c: 'Inteligencia emocional', t: 'Un feedback es crítico pero constructivo.', opts: ['Te pones a la defensiva inmediatamente.', 'Escucho, reflexiono y considero qué puedo aprender.', 'Rechazas el feedback.', 'Te desanimas sin analizar.'], ans: 1},
  {q: 58, c: 'Inteligencia emocional', t: 'Dos colegas tienen un conflicto y buscan que tomes partido.', opts: ['Tomas partido rápidamente.', 'Escuchas ambos lados con empatía y buscas solución mutua.', 'Evitas completamente.', 'Dictas un veredicto sin escuchar.'], ans: 1},
  {q: 59, c: 'Inteligencia emocional', t: 'Celebras un logro importante.', opts: ['Celebras solo internamente.', 'Compartes la alegría, agradeces contribuciones y celebras juntos.', 'Minimizas el logro.', 'Te distraes con lo siguiente.'], ans: 1},
  {q: 60, c: 'Inteligencia emocional', t: 'Notas que tu estado emocional afecta tus decisiones.', opts: ['Continúas decidiendo en ese estado.', 'Lo reconozco, pausas decisiones importantes hasta estar más calmado.', 'Niego el impacto emocional.', 'Dejás que otros decidan.'], ans: 1},

  {q: 61, c: 'Orientación al cliente', t: 'Un cliente pide algo que no puedes ofrecer exactamente.', opts: ['Dices que no y cierras el tema.', 'Explicas la limitación y propones alternativas viables.', 'Prometes algo que no depende de ti.', 'Ignoras la solicitud.'], ans: 1},
  {q: 62, c: 'Orientación al cliente', t: 'Un cliente está insatisfecho con una solución anterior.', opts: ['Lo defensas.', 'Busco entender raíz de la insatisfacción y busco remediar.', 'Lo culpo de tener expectativas irreales.', 'Ofreces un reembolso sin investigar.'], ans: 1},
  {q: 63, c: 'Orientación al cliente', t: 'Un cliente tiene un problema que NO puede resolver en el momento.', opts: ['Lo dejas esperar indefinidamente.', 'Explicás el timeline, te mantienes informado y actualizas regularmente.', 'Prometes una solución inmediata que no puedes cumplir.', 'Lo transferís a otro sin contexto.'], ans: 1},
  {q: 64, c: 'Orientación al cliente', t: 'Un cliente solicita cambios que aumentarían significativamente el costo.', opts: ['Los rechazas directamente.', 'Explicas el impacto, opciones y permites decidir.', 'Los ejecutas sin informar.', 'Lo haces resentidamente.'], ans: 1},
  {q: 65, c: 'Orientación al cliente', t: 'Un cliente da feedback negativo sobre tu servicio.', opts: ['Lo descartas.', 'Lo validas, investigas y buscas mejorar en esa área.', 'Culpas al cliente.', 'Te ofendes personalmente.'], ans: 1},
  {q: 66, c: 'Orientación al cliente', t: 'Un cliente tiene una necesidad que no es tu especialidad.', opts: ['Dices que no está en tu alcance.', 'Buscas entender y conectas con quien puede ayudar.', 'Lo dejas sin solución.', 'Das una solución mediocre.'], ans: 1},
  {q: 67, c: 'Orientación al cliente', t: 'Un cliente de bajo volumen tiene una solicitud especial.', opts: ['La depriorizas por su tamaño.', 'Evalúas el impacto y buscas ofrecerle valor también.', 'Le cobras una tarifa disuasoria.', 'Ofreces un servicio inferior.'], ans: 1},
  {q: 68, c: 'Orientación al cliente', t: 'Detectas un problema potencial antes que el cliente lo reporte.', opts: ['Esperas que lo descubra.', 'Lo comunicas proactivamente con soluciones propuestas.', 'Lo ocultas esperando que no lo note.', 'Lo reportas con enojo.'], ans: 1},
  {q: 69, c: 'Orientación al cliente', t: 'Un cliente es muy exigente pero rentable.', opts: ['Lo tratas diferente que a otros.', 'Le ofreces la misma calidad que a todos con profesionalismo.', 'Lo descuidas porque es difícil.', 'Le cobras más sin justificación.'], ans: 1},
  {q: 70, c: 'Orientación al cliente', t: 'Un cliente expresa satisfacción con tu trabajo.', opts: ['Lo tomas como obvio.', 'Lo valoras, agradeces y buscas ampliar la relación.', 'Te enfocas solo en lo siguiente.', 'Asumes que estará satisfecho indefinidamente.'], ans: 1},

  {q: 71, c: 'Ética y responsabilidad', t: 'Detectas un error que podría favorecer tus resultados personales.', opts: ['Lo aprovechas.', 'Lo reportas y actúas de manera transparente.', 'Lo ocultas.', 'Lo mencionas casualmente.'], ans: 1},
  {q: 72, c: 'Ética y responsabilidad', t: 'Presionan para entregar un trabajo que no cumple con los estándares.', opts: ['Lo entregas presionado.', 'Explicas los riesgos, ofreces alternativas viables con la calidad adecuada.', 'Abandonas el proyecto.', 'Lo entregas esperando que nadie lo note.'], ans: 1},
  {q: 73, c: 'Ética y responsabilidad', t: 'Una información confidencial podría beneficiarte si la compartes.', opts: ['La compartes selectivamente.', 'La mantienes confidencial sin importar el beneficio.', 'La compartes pero pides confidencialidad.', 'La usas para ventaja personal.'], ans: 1},
  {q: 74, c: 'Ética y responsabilidad', t: 'Notas que un colega está tomando crédito por tu trabajo.', opts: ['Lo ignoras.', 'Lo conversas privadamente o lo aclaras apropiadamente.', 'Lo expones públicamente.', 'Te desquitás saboteando su trabajo.'], ans: 1},
  {q: 75, c: 'Ética y responsabilidad', t: 'Se descubre una conducta no ética en tu área.', opts: ['Lo ocultas para proteger al equipo.', 'Lo reportas apropiadamente a la autoridad competente.', 'Lo ignoras.', 'Lo manejas internamente sin transparencia.'], ans: 1},
  {q: 76, c: 'Ética y responsabilidad', t: 'Un cliente solicita algo que está en una zona gris ética.', opts: ['Lo haces si te pagan.', 'Explicas por qué no es apropiado y qué es aceptable.', 'Lo haces sin comunicar.', 'Lo rechazas sin explicación.'], ans: 1},
  {q: 77, c: 'Ética y responsabilidad', t: 'Eres responsable de un resultado pero fue principalmente de otros.', opts: ['Asumes todo el crédito.', 'Reconoces contribuciones y asumes la responsabilidad general.', 'Culpas a otros.', 'Evitas responsabilidad completamente.'], ans: 1},
  {q: 78, c: 'Ética y responsabilidad', t: 'Un proceso que propusiste tiene un defecto que ahora afecta.', opts: ['Lo negas.', 'Lo reconozco, investigo raíz y propongo mejora.', 'Culpa a quien implementó.', 'Lo ignoras esperando que se resuelva.'], ans: 1},
  {q: 79, c: 'Ética y responsabilidad', t: 'Ves a un compañero tomar recursos de la empresa para uso personal.', opts: ['Ignoras para no involucrarte.', 'Lo conversas con esa persona o lo reportas apropiadamente.', 'Lo hablas con otros.', 'Lo ignoras pero lo juzgas.'], ans: 1},
  {q: 80, c: 'Ética y responsabilidad', t: 'Un cliente potencial te pide que exageres resultados de un proyecto anterior.', opts: ['Lo haces para ganar el cliente.', 'Presentas resultados reales con contexto positivo.', 'Lo rechazas abruptamente.', 'Lo haces pero aclaras "los números son aproximados".'], ans: 1}
];

async function seedAll() {
  try {
    console.log('🌱 Cargando TODAS las 80 preguntas del TEST DE SOFT SKILLS...\n');

    const examCheck = await pool.query(
      'SELECT id FROM exams WHERE name = $1 ORDER BY id DESC LIMIT 1',
      ['TEST DE SOFT SKILLS']
    );

    if (examCheck.rows.length === 0) {
      throw new Error('Test no encontrado');
    }

    const examId = examCheck.rows[0].id;
    console.log(`✅ Usando exam ID: ${examId}\n`);

    await pool.query('DELETE FROM questions WHERE exam_id = $1', [examId]);

    let count = 0;
    for (const q of questions) {
      const qResult = await pool.query(
        'INSERT INTO questions (exam_id, title, type, description) VALUES ($1, $2, $3, $4) RETURNING id',
        [examId, q.t, 'multiple_choice', q.c]
      );

      const questionId = qResult.rows[0].id;

      for (let i = 0; i < 4; i++) {
        const score = (i === q.ans) ? 2 : 0;
        await pool.query(
          'INSERT INTO question_options (question_id, text, score, option_order) VALUES ($1, $2, $3, $4)',
          [questionId, q.opts[i], score, i + 1]
        );
      }

      count++;
      if (count % 10 === 0) console.log(`✓ ${count}/80 preguntas`);
    }

    console.log(`\n✅ ¡ÉXITO! Todas las 80 preguntas cargadas correctamente`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedAll();
