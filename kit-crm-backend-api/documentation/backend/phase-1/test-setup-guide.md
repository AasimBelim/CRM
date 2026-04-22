# Test Setup Guide - Phase 1

## Overview
This document provides instructions for setting up and running automated tests for the Phase 1 CRM backend APIs using Jest and Supertest.

## Prerequisites

### 1. Dependencies
All required dependencies have been added to package.json:
- **jest**: Test framework
- **supertest**: HTTP assertion library
- **ts-jest**: TypeScript support for Jest
- **@jest/globals**: TypeScript definitions
- **@faker-js/faker**: Test data generation
- **@types/jest, @types/supertest**: TypeScript type definitions

Install dependencies:
```bash
npm install
```

### 2. Database Setup

#### Test Database Configuration
Create a `.env.test` file in the backend-api root directory with test database credentials:

```env
NODE_ENV=test
DATABASE_URL=postgresql://username:password@localhost:5432/crm_test
JWT_SECRET=your_test_jwt_secret_here
PORT=8000
```

#### Seed Test Data
The tests require at least one test user in the database. You can either:

**Option 1: Manual Database Insertion**
```sql
-- Insert test role
INSERT INTO roles (name, created_at, updated_at) 
VALUES ('Admin', NOW(), NOW()) 
RETURNING id;

-- Insert test user (use the role id from above)
INSERT INTO users (email, password_hash, role_id, created_at, updated_at) 
VALUES (
  'test@example.com',
  '$2a$10$YourHashedPasswordHere',  -- Hash for 'test123'
  1,  -- role_id from previous insert
  NOW(),
  NOW()
);
```

**Option 2: Use Application API**
If the backend server is running on port 8000, you can create a test user via the users API.

**Option 3: Database Migration/Seed Script**
Run the seed script (if available):
```bash
npm run db:seed:test
```

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode (reruns tests on file changes)
```bash
npm run test:watch
```

### With Coverage Report
```bash
npm run test:coverage
```

### Single Test File
```bash
npm test -- __tests__/api/companies.test.ts
```

### Specific Test Suite
```bash
npm test -- -t "Companies API"
```

## Test Structure

### Directory Layout
```
backend-api/
├── __tests__/
│   ├── setup.ts                 # Test environment setup
│   ├── helpers/
│   │   └── testUtils.ts         # Shared test utilities
│   └── api/
│       ├── companies.test.ts    # Companies API tests
│       ├── contacts.test.ts     # Contacts API tests
│       ├── dataSources.test.ts  # Data Sources API tests
│       ├── leadConfig.test.ts   # Lead Config API tests
│       └── leads.test.ts        # Leads API tests
├── jest.config.js               # Jest configuration
└── package.json                 # Test scripts
```

### Test Utilities

The `__tests__/helpers/testUtils.ts` file provides reusable test functions:

- **getAuthToken()**: Authenticates and returns JWT token
- **authenticatedRequest(app)**: Returns request instance with auth header
- **unauthenticatedRequest(app)**: Returns request instance without auth
- **generateEmail()**: Creates unique test email
- **generateDomain()**: Creates unique test domain
- **sleep(ms)**: Async delay utility

## Test Coverage by Module

### Phase 1 Modules (100% coverage)

1. **Companies API** (`companies.test.ts`)
   - Create company (positive/negative cases)
   - List companies with pagination, filtering, sorting, search
   - Get single company
   - Update company
   - Delete company (soft delete)
   - Bulk assign companies

2. **Contacts API** (`contacts.test.ts`)
   - Create contact with company association
   - Email validation
   - Primary contact management
   - Get contacts by company
   - List, update, delete contacts

3. **Data Sources API** (`dataSources.test.ts`)
   - Create, list, update, delete data sources
   - Active/inactive filtering
   - Duplicate name validation

4. **Data Imports API** (`dataSources.test.ts`)
   - Create import job
   - List imports with pagination
   - Update import status
   - Filter by status

5. **Lead Configuration API** (`leadConfig.test.ts`)
   - **Lead Statuses**: CRUD operations, color codes, duplicate validation
   - **Lost Reasons**: CRUD operations, duplicate validation

6. **Leads API** (`leads.test.ts`)
   - Create lead with validation
   - Priority levels (low/medium/high/urgent)
   - Foreign key validation (company, contact, status, user)
   - List with filtering (company, status, priority, value range, date range)
   - Search by title
   - Sort by various fields
   - Update and delete leads
   - Bulk assign leads to user
   - Tags support

## Test Patterns

### Positive Test Cases
- Valid data creation
- Successful retrieval
- Proper pagination
- Filtering and sorting
- Successful updates and deletes

### Negative Test Cases
- Missing required fields
- Invalid data formats
- Non-existent resource (404)
- Duplicate entries (409)
- Unauthorized access (401)
- Foreign key violations

### Authentication Tests
Each test suite validates:
- Authenticated requests succeed
- Unauthenticated requests return 401

## Test Data Management

### Dynamic Test Data
Tests use faker.js to generate unique data:
```typescript
const uniqueEmail = `test_${Date.now()}_${Math.random().toString(36)}@example.com`;
const uniqueDomain = `${Date.now()}.example.com`;
```

### Test Isolation
- Each test creates its own data
- Tests do not depend on execution order
- Soft deletes prevent data conflicts

## Troubleshooting

### Issue: "Test user not found"
**Solution**: Ensure test database has a user with credentials:
- Email: test@example.com
- Password: test123

### Issue: "Cannot connect to database"
**Solution**: 
- Verify`.env.test` has correct DATABASE_URL
- Ensure PostgreSQL is running
- Check database exists and is accessible

### Issue: "Port 8000 already in use"
**Solution**: 
- Stop the development server before running tests
- Or configure tests to use a different port

### Issue: "Module not found"
**Solution**: Run `npm install` to ensure all dependencies are installed

### Issue: Tests timing out
**Solution**: 
- Increase Jest timeout in `jest.config.js` or `__tests__/setup.ts`
- Check database connection speed

## Best Practices

1. **Run tests before committing**: Ensure all tests pass
2. **Write tests for new features**: Maintain test coverage
3. **Use descriptive test names**: Make failures easy to diagnose
4. **Keep tests isolated**: No shared state between tests
5. **Mock external services**: Tests should be self-contained
6. **Maintain test data**: Keep test database clean and seeded

## CI/CD Integration

For continuous integration pipelines, configure:

```yaml
# Example GitHub Actions workflow
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v2
    - uses: actions/setup-node@v2
    - run: npm install
    - run: npm test
```

## Performance

Average test execution time:
- All Phase 1 tests: ~10-15 seconds
- Individual test suite: ~2-4 seconds
- Coverage generation: ~15-20 seconds

## Next Steps

After Phase 1 tests pass:
1. Review test coverage report
2. Document any edge cases found
3. Proceed to Phase 2 implementation
4. Create tests for Phase 2 APIs following the same patterns

## Contact

For test-related questions or issues, refer to:
- [Architecture Documentation](../ARCHITECTURE.md)
- [API Endpoints Documentation](./api-endpoints.md)
- [Implementation Guide](./implementation-guide.md)
