const express = require('express');
const examRoutes = require('./src/routes/exams');

const app = express();
app.use(express.json());
app.use('/api/exams', examRoutes);

// Log all registered routes
const router = app._router;
const routes = [];

function print(path, layer) {
  if (layer.route) {
    const methods = Object.keys(layer.route.methods);
    routes.push(`${methods.join(',').toUpperCase()} ${path}${layer.route.path}`);
  } else if (layer.name === 'router' && layer.handle.stack) {
    let stackPath = path;
    layer.handle.stack.forEach(handler => {
      print(stackPath, handler);
    });
  }
}

router.stack.forEach(middleware => {
  if (middleware.route) {
    routes.push(`${Object.keys(middleware.route.methods).join(',').toUpperCase()} ${middleware.route.path}`);
  } else if (middleware.name === 'router') {
    middleware.handle.stack.forEach(handler => {
      print('/api/exams', handler);
    });
  }
});

console.log('🗂️ Rutas Registradas:');
routes.forEach(r => console.log(`  ${r}`));
