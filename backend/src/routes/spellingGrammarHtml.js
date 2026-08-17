const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const SpellingGrammarService = require('../services/spellingGrammarService');

// Servir la prueba como página HTML completa
router.get('/test-page/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Verificar que el candidato tiene acceso
    const vacancyResult = await pool.query(
      `SELECT cv.id FROM candidate_vacancies cv WHERE cv.token = $1 LIMIT 1`,
      [token]
    );

    if (vacancyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Token inválido' });
    }

    // Cargar las preguntas
    const test = await SpellingGrammarService.getTestWithQuestions(1);
    const questionsJson = JSON.stringify(test.questions);

    // Generar HTML
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prueba de Ortografía y Gramática</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; color: #1f2937; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header h1 { margin-bottom: 10px; font-size: 24px; }
    .progress-bar { width: 100%; height: 8px; background: #e5e7eb; border-radius: 4px; margin-top: 15px; overflow: hidden; }
    .progress-fill { height: 100%; background: #3b82f6; transition: width 0.3s; }
    .question-container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .question-text { font-size: 18px; font-weight: 500; margin-bottom: 25px; }
    .options { display: flex; flex-direction: column; gap: 12px; margin-bottom: 30px; }
    .option { display: flex; align-items: center; padding: 12px; border: 2px solid #e5e7eb; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
    .option:hover { border-color: #3b82f6; background: #f0f9ff; }
    .option.selected { border-color: #3b82f6; background: #f0f9ff; }
    .option input { margin-right: 12px; width: 18px; height: 18px; cursor: pointer; }
    .buttons { display: flex; gap: 12px; margin-top: 30px; }
    .button { padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s; }
    .button-prev { background: #6b7280; color: white; }
    .button-prev:hover { background: #4b5563; }
    .button-prev:disabled { background: #d1d5db; cursor: not-allowed; }
    .button-next { background: #3b82f6; color: white; margin-left: auto; }
    .button-next:hover { background: #2563eb; }
    .button-submit { background: #10b981; color: white; margin-left: auto; }
    .button-submit:hover { background: #059669; }
    .info-text { text-align: center; color: #6b7280; font-size: 14px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Prueba de Ortografía y Gramática</h1>
      <div style="display: flex; justify-content: space-between; margin-top: 10px;">
        <span id="question-count">Pregunta 1 de ${test.questions.length}</span>
        <span id="progress-percent">0%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
      </div>
    </div>

    <form id="test-form" class="question-container">
      <div id="question-display"></div>
      <div class="buttons">
        <button type="button" class="button button-prev" id="btn-prev" onclick="previousQuestion()">← Anterior</button>
        <button type="button" class="button button-next" id="btn-next" onclick="nextQuestion()">Siguiente →</button>
        <button type="submit" class="button button-submit" id="btn-submit" style="display: none;">Enviar Respuestas</button>
      </div>
      <p class="info-text" id="info-text"></p>
    </form>
  </div>

  <script>
    const questions = ${questionsJson};
    const token = '${token}';
    let currentQuestion = 0;
    const answers = {};

    function showQuestion(index) {
      if (index < 0 || index >= questions.length) return;
      currentQuestion = index;
      const q = questions[index];
      const display = document.getElementById('question-display');

      let optionsHtml = questions[index].options.map((opt, i) => {
        const isSelected = answers[q.id] === opt;
        return '<label class="option ' + (isSelected ? 'selected' : '') + '">' +
          '<input type="radio" name="answer" value="' + opt + '" ' +
          (isSelected ? 'checked' : '') + ' onchange="handleAnswer(\'' + q.id + '\', \'' + opt + '\')">' +
          '<span>' + opt + '</span>' +
          '</label>';
      }).join('');

      display.innerHTML = '<div class="question-text">' + q.text + '</div><div class="options">' + optionsHtml + '</div>';
      updateUI();
    }

    function handleAnswer(qId, value) {
      answers[qId] = value;
      updateUI();
    }

    function updateUI() {
      const progress = ((currentQuestion + 1) / questions.length) * 100;
      document.getElementById('progress-fill').style.width = progress + '%';
      document.getElementById('question-count').textContent = 'Pregunta ' + (currentQuestion + 1) + ' de ' + questions.length;
      document.getElementById('progress-percent').textContent = Math.round(progress) + '%';
      document.getElementById('btn-prev').disabled = currentQuestion === 0;
      document.getElementById('btn-next').style.display = currentQuestion === questions.length - 1 ? 'none' : 'block';
      document.getElementById('btn-submit').style.display = currentQuestion === questions.length - 1 ? 'block' : 'none';

      const answered = Object.keys(answers).length;
      document.getElementById('info-text').textContent = answered + ' de ' + questions.length + ' respondidas';
    }

    function nextQuestion() {
      if (currentQuestion < questions.length - 1) {
        showQuestion(currentQuestion + 1);
      }
    }

    function previousQuestion() {
      if (currentQuestion > 0) {
        showQuestion(currentQuestion - 1);
      }
    }

    document.getElementById('test-form').onsubmit = async (e) => {
      e.preventDefault();
      const answersData = {};
      questions.forEach(q => {
        answersData[q.id] = answers[q.id] || '';
      });

      try {
        const response = await fetch('/api/spelling-grammar/results/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({
            testId: 1,
            answers: answersData,
            timeSeconds: Math.floor(Date.now() / 1000)
          })
        });

        if (response.ok) {
          alert('Prueba completada! Tus respuestas han sido guardadas.');
          window.location.href = '/evaluacion?token=' + token;
        } else {
          alert('Error al enviar respuestas');
        }
      } catch (error) {
        alert('Error: ' + error.message);
      }
    };

    showQuestion(0);
  </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al cargar prueba' });
  }
});

module.exports = router;
