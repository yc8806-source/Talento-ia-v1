-- Insertar preguntas de prueba
INSERT INTO questions (title, type, competency_id, description) VALUES
('¿Cuál es la importancia de la comunicación efectiva en ventas?', 'multiple_choice', 1, 'Pregunta sobre comunicación'),
('La empatía es fundamental en el servicio al cliente', 'true_false', 10, 'Pregunta sobre empatía'),
('¿Qué tan importante es la persuasión para cerrar ventas?', 'likert', 2, 'Pregunta Likert sobre persuasión'),
('¿Cuál es el primer paso en una negociación?', 'multiple_choice', 3, 'Pregunta sobre negociación'),
('La redacción clara es esencial en comunicaciones escritas', 'true_false', 5, 'Pregunta sobre redacción'),
('¿Cómo manejarías una objeción del cliente?', 'multiple_choice', 1, 'Pregunta sobre manejo de objeciones'),
('La paciencia es clave en servicio al cliente', 'true_false', 10, 'Pregunta sobre paciencia'),
('Importancia de la orientación al resultado', 'likert', 4, 'Pregunta sobre orientación');

-- Obtener IDs de las preguntas insertadas
SELECT id, title FROM questions WHERE title LIKE '%comunicación efectiva%' OR title LIKE '%empatía%' OR title LIKE '%persuasión%' LIMIT 8;

-- Insertar opciones para la primera pregunta (multiple choice)
INSERT INTO question_options (question_id, text, score, option_order)
SELECT id, 'Mejora la claridad del mensaje', 25, 1 FROM questions WHERE title LIKE '%comunicación efectiva%' LIMIT 1;

INSERT INTO question_options (question_id, text, score, option_order)
SELECT id, 'Permite llegar a acuerdos mejores', 25, 2 FROM questions WHERE title LIKE '%comunicación efectiva%' LIMIT 1;

INSERT INTO question_options (question_id, text, score, option_order)
SELECT id, 'Aumenta la confianza del cliente', 25, 3 FROM questions WHERE title LIKE '%comunicación efectiva%' LIMIT 1;

INSERT INTO question_options (question_id, text, score, option_order)
SELECT id, 'Todas las anteriores', 25, 4 FROM questions WHERE title LIKE '%comunicación efectiva%' LIMIT 1;

-- Insertar opciones para true/false (empatía)
INSERT INTO question_options (question_id, text, score, option_order)
SELECT id, 'Verdadero', 100, 1 FROM questions WHERE title LIKE '%empatía%' LIMIT 1;

INSERT INTO question_options (question_id, text, score, option_order)
SELECT id, 'Falso', 0, 2 FROM questions WHERE title LIKE '%empatía%' LIMIT 1;

-- Insertar opciones para Likert (persuasión)
INSERT INTO question_options (question_id, text, score, option_order)
SELECT id, 'Muy en desacuerdo', 0, 1 FROM questions WHERE title LIKE '%persuasión%' AND type = 'likert' LIMIT 1;

INSERT INTO question_options (question_id, text, score, option_order)
SELECT id, 'En desacuerdo', 25, 2 FROM questions WHERE title LIKE '%persuasión%' AND type = 'likert' LIMIT 1;

INSERT INTO question_options (question_id, text, score, option_order)
SELECT id, 'Neutral', 50, 3 FROM questions WHERE title LIKE '%persuasión%' AND type = 'likert' LIMIT 1;

INSERT INTO question_options (question_id, text, score, option_order)
SELECT id, 'De acuerdo', 75, 4 FROM questions WHERE title LIKE '%persuasión%' AND type = 'likert' LIMIT 1;

INSERT INTO question_options (question_id, text, score, option_order)
SELECT id, 'Muy de acuerdo', 100, 5 FROM questions WHERE title LIKE '%persuasión%' AND type = 'likert' LIMIT 1;

-- Insertar opciones para negociación (multiple choice)
INSERT INTO question_options (question_id, text, score, option_order)
SELECT id, 'Escuchar activamente al otro lado', 25, 1 FROM questions WHERE title LIKE '%negociación%' LIMIT 1;

INSERT INTO question_options (question_id, text, score, option_order)
SELECT id, 'Preparar tu posición', 25, 2 FROM questions WHERE title LIKE '%negociación%' LIMIT 1;

INSERT INTO question_options (question_id, text, score, option_order)
SELECT id, 'Comprender los objetivos comunes', 25, 3 FROM questions WHERE title LIKE '%negociación%' LIMIT 1;

INSERT INTO question_options (question_id, text, score, option_order)
SELECT id, 'Todas las anteriores', 25, 4 FROM questions WHERE title LIKE '%negociación%' LIMIT 1;
