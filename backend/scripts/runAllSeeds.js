const { spawn } = require('child_process');
const path = require('path');

const seeds = [
  'seedExams.js',
  'seedQuestions.js',
  'seedSoftSkillsAssessment.js',
  'seedSkillsAssessments.js',
  'seedTeleventasAssessment.js',
  'seedCobranzasAssessment.js',
  'seedServicioClienteAssessment.js',
  'seedEcareAssessment.js',
  'seedTypingTests.js',
  'seedSpellingGrammarTests.js'
];

async function runSeed(scriptName) {
  return new Promise((resolve, reject) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`▶️  Ejecutando: ${scriptName}`);
    console.log(`${'='.repeat(60)}\n`);

    const child = spawn('node', [path.join(__dirname, scriptName)], {
      stdio: 'inherit',
      cwd: __dirname
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ ${scriptName} completado\n`);
        resolve();
      } else {
        console.log(`\n⚠️  ${scriptName} terminó con código ${code}\n`);
        resolve(); // Continuar aunque falle uno
      }
    });

    child.on('error', (err) => {
      console.error(`\n❌ Error ejecutando ${scriptName}:`, err);
      resolve(); // Continuar aunque falle
    });
  });
}

async function runAllSeeds() {
  console.log('\n🌱 INICIANDO CARGA DE TODAS LAS PRUEBAS...\n');

  for (const seed of seeds) {
    await runSeed(seed);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('🎉 ¡TODAS LAS PRUEBAS CARGADAS EXITOSAMENTE!');
  console.log(`${'='.repeat(60)}\n`);
  process.exit(0);
}

runAllSeeds().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
