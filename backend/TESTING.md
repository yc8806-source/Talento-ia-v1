# Testing Infrastructure - Talent IA Backend

## Overview

The backend testing infrastructure is built with **Jest** and includes comprehensive test suites for authentication, security, integration, and bulk operations.

## Test Structure

```
backend/tests/
├── setup.js                    # Global test configuration
├── unit/                       # Unit tests
│   └── auth.test.js           # Authentication and validation tests
├── integration/               # Integration tests
│   ├── api.test.js            # API endpoints and health checks
│   ├── candidates.test.js     # Candidates CRUD operations
│   └── candidateDashboard.test.js  # Dashboard functionality
├── security/                  # Security-focused tests
│   └── security.test.js       # XSS, SQL injection, rate limiting, etc.
└── bulk/                      # Bulk operations tests
    └── bulk-actions.test.js   # Bulk assignment, export, delete, etc.
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests with coverage report
```bash
npm run test:coverage
```

### Run specific test suites

**Unit Tests (Authentication)**
```bash
npm run test:unit
```
Tests password hashing, JWT tokens, email validation, and password strength.

**Integration Tests (API)**
```bash
npm run test:integration
```
Tests API endpoints including health checks, authentication, CORS, rate limiting, and security headers.

**Security Tests**
```bash
npm run test:security
```
Tests XSS protection, SQL injection prevention, input validation, CSRF protection, and secure password requirements.

**Bulk Operations Tests**
```bash
npm run test:bulk
```
Tests bulk assignment, invitations, export, delete, and status update operations.

### Watch Mode
```bash
npm run test:watch
```
Automatically re-runs tests when files change.

## Coverage Thresholds

The project enforces **70% coverage** across:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

View coverage report:
```bash
npm run test:coverage
# Then open coverage/lcov-report/index.html
```

## Test Files Overview

### Unit Tests: `tests/unit/auth.test.js`
- ✅ Password hashing with bcryptjs
- ✅ JWT token creation, verification, and expiration
- ✅ Email format validation
- ✅ Password strength validation

**Example:**
```javascript
test('debe hashear una contraseña correctamente', async () => {
  const password = 'TestPassword123!';
  const hashedPassword = await bcrypt.hash(password, 10);
  expect(hashedPassword).not.toBe(password);
});
```

### Integration Tests: `tests/integration/api.test.js`
- ✅ Health check endpoints
- ✅ Login with valid/invalid credentials
- ✅ Rate limiting enforcement
- ✅ CORS configuration
- ✅ Security headers (Helmet.js)

**Example:**
```javascript
test('POST /auth/login debe rechazar credenciales inválidas', async () => {
  const credentials = {
    email: 'wrong@example.com',
    password: 'WrongPassword123!'
  };
  const response = await request(apiUrl)
    .post('/auth/login')
    .send(credentials);
  expect(response.status).toBe(401);
});
```

### Integration Tests: `tests/integration/candidates.test.js`
- ✅ Get all candidates with pagination and filtering
- ✅ Create new candidates with validation
- ✅ Get candidate by ID
- ✅ Update candidate information
- ✅ Delete candidates with audit logging
- ✅ Search by name, email, and multiple criteria

**Example:**
```javascript
test('debe filtrar candidatos por búsqueda', () => {
  const allCandidates = [
    { id: 1, name: 'Juan Pérez', email: 'juan@example.com' },
    { id: 2, name: 'María García', email: 'maria@example.com' }
  ];
  const filtered = allCandidates.filter(c =>
    c.name.toLowerCase().includes('Juan')
  );
  expect(filtered).toHaveLength(1);
});
```

### Integration Tests: `tests/integration/candidateDashboard.test.js`
- ✅ Candidate summary (total evaluations, average score)
- ✅ Current evaluation status
- ✅ Evaluation history with pagination
- ✅ Detailed evaluation results with competency scores
- ✅ Performance metrics and percentile ranking
- ✅ Authentication and authorization checks

**Example:**
```javascript
test('debe retornar resumen del candidato', () => {
  const mockSummary = {
    name: 'Juan Pérez',
    totalEvaluations: 5,
    completedEvaluations: 3,
    averageScore: 82.5
  };
  expect(mockSummary.averageScore).toBeLessThanOrEqual(100);
});
```

### Security Tests: `tests/security/security.test.js`
- ✅ XSS (Cross-Site Scripting) prevention
  - Sanitizes dangerous HTML
  - Removes inline scripts
  - Allows safe HTML content
- ✅ SQL Injection prevention
  - Detects SQL keywords in input
  - Validates safe input patterns
- ✅ Input validation
  - Email validation with length limits
  - Phone number validation
- ✅ CSRF token generation and validation
- ✅ Rate limiting for excessive login attempts
- ✅ Secure password requirements
  - Minimum 8 characters
  - Uppercase letters
  - Numbers
  - Special characters

**Example:**
```javascript
test('debe sanitizar HTML peligroso', () => {
  const maliciousInput = '<img src=x onerror="alert(\'XSS\')">';
  const sanitized = sanitizeHtml(maliciousInput);
  expect(sanitized).not.toContain('onerror');
});
```

### Bulk Operations Tests: `tests/bulk/bulk-actions.test.js`
- ✅ Bulk candidate assignment to vacancies
  - Success/failure tracking
  - Partial completion handling
- ✅ Bulk send invitations
  - Token generation
  - Email delivery logging
  - Duplicate prevention
- ✅ Bulk export to CSV
  - CSV formatting with proper escaping
  - Large volume handling (1000+ records)
- ✅ Bulk delete with confirmation
  - Audit logging
  - Protected records handling
- ✅ Bulk update evaluation status
  - State transition validation
  - Batch processing
- ✅ Permission validation and audit trails
- ✅ Performance metrics for large operations

**Example:**
```javascript
test('debe asignar múltiples candidatos a una vacante', () => {
  const candidateIds = [1, 2, 3, 4, 5];
  const results = candidateIds.map(id => ({
    candidateId: id,
    assigned: true
  }));
  expect(results).toHaveLength(5);
  expect(results.every(r => r.assigned === true)).toBe(true);
});
```

## Test Configuration

### Jest Configuration: `jest.config.js`
```javascript
module.exports = {
  testEnvironment: 'node',           // Node.js environment
  coverageDirectory: 'coverage',     // Coverage report location
  testMatch: ['**/?(*.)+(spec|test).js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

### Global Setup: `tests/setup.js`
- Sets `NODE_ENV=test`
- Configures JWT_SECRET for test tokens
- Sets test DATABASE_URL
- Mocks console methods to reduce test output noise

## Dependencies

### Testing Frameworks
- **jest**: ^29.7.0 - Testing framework
- **supertest**: ^6.3.3 - HTTP assertion library for API testing

### Security Libraries
- **bcryptjs**: ^3.0.3 - Password hashing
- **sanitize-html**: ^2.17.5 - XSS prevention
- **helmet**: ^8.2.0 - Security headers
- **express-rate-limit**: ^8.5.2 - Rate limiting

## Writing New Tests

### Basic Test Template
```javascript
describe('Feature Name', () => {
  describe('Specific Functionality', () => {
    test('should do something specific', () => {
      // Arrange: Set up test data
      const input = { /* ... */ };

      // Act: Execute the code being tested
      const result = functionUnderTest(input);

      // Assert: Verify the result
      expect(result).toEqual(expectedValue);
    });
  });
});
```

### Testing Async Functions
```javascript
test('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### Testing Error Cases
```javascript
test('should throw an error on invalid input', () => {
  expect(() => {
    functionThatThrows();
  }).toThrow();
});
```

## Best Practices

1. **Keep tests focused**: One assertion per test when possible
2. **Use descriptive names**: Test names should explain what is being tested
3. **Follow AAA pattern**: Arrange, Act, Assert
4. **Mock external dependencies**: Use Jest mocks for database, APIs, etc.
5. **Test edge cases**: Don't just test the happy path
6. **Avoid test interdependence**: Each test should be independent
7. **Clean up after tests**: Use `afterEach` or `afterAll` to clean up

## Continuous Integration

These tests should run on every commit in your CI/CD pipeline. Ensure:
- All tests pass
- Coverage thresholds are met (70%)
- No security warnings from dependencies

## Troubleshooting

### Tests timeout
- Increase timeout: `jest.setTimeout(15000)`
- Check for unresolved promises

### Coverage not meeting threshold
- Run `npm run test:coverage` to see what's missing
- Add tests for uncovered lines
- Consider if coverage thresholds need adjustment

### Database connection errors in integration tests
- Ensure test database exists and is accessible
- Check DATABASE_URL in tests/setup.js
- Run migrations if needed

### Port conflicts
- If port 3000 is in use, update test configuration
- Use different ports for concurrent test runs

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

