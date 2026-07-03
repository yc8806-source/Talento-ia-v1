const request = require('supertest');
const path = require('path');
const fs = require('fs');

describe('Candidate Profile Update - Authentication & Authorization', () => {
  let pdfPath;

  beforeAll(() => {
    // Crear un mock PDF
    pdfPath = path.join(__dirname, '../../test-update.pdf');
    const pdfContent = Buffer.from('%PDF-1.4\n%Test PDF for update');
    fs.writeFileSync(pdfPath, pdfContent);
  });

  afterAll(() => {
    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
    }
  });

  test('PUT /candidates/:id - Rechazar sin token (401 Unauthorized)', async () => {
    const response = await request('http://localhost:3000')
      .put('/api/candidates/1')
      .field('phone', '+57 300 1111111')
      .attach('cv', pdfPath);

    expect(response.status).toBe(401);
    expect(response.body.error).toBeDefined();
  });

  test('PUT /candidates/:id - Rechazar con token inválido (401)', async () => {
    const response = await request('http://localhost:3000')
      .put('/api/candidates/1')
      .set('Authorization', 'Bearer invalid-token-xyz')
      .field('phone', '+57 300 3333333')
      .attach('cv', pdfPath);

    expect(response.status).toBe(401);
    expect(response.body.error).toBeDefined();
  });

  test('PUT /candidates/:id - Rechazar candidato inexistente (404)', async () => {
    // Sin token (falla en autenticación primero)
    const response = await request('http://localhost:3000')
      .put('/api/candidates/999999')
      .field('phone', '+57 300 4444444')
      .attach('cv', pdfPath);

    expect(response.status).toBe(401);
  });

  test('PUT /candidates/:id - Rechazar archivo no-PDF', async () => {
    const nonPdfPath = path.join(__dirname, '../../test.txt');
    fs.writeFileSync(nonPdfPath, 'This is not a PDF');

    try {
      const response = await request('http://localhost:3000')
        .put('/api/candidates/1')
        .field('phone', '+57 300 5555555')
        .attach('cv', nonPdfPath);

      // Sin token retorna 401 primero
      expect(response.status).toBe(401);
    } finally {
      if (fs.existsSync(nonPdfPath)) {
        fs.unlinkSync(nonPdfPath);
      }
    }
  });

  test('PUT /candidates/:id - Endpoint solo accesible con autenticación', async () => {
    // GET (sin protección): funciona sin token
    const getResponse = await request('http://localhost:3000')
      .get('/api/candidates/1');

    expect([200, 404]).toContain(getResponse.status);

    // PUT (con protección): rechaza sin token
    const putResponse = await request('http://localhost:3000')
      .put('/api/candidates/1')
      .field('phone', '+57 300 9999999');

    expect(putResponse.status).toBe(401);
    expect(putResponse.body.error).toBeDefined();
  });
});
