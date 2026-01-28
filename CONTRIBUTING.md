# Contributing to KhanFlow

Thank you for your interest in contributing to KhanFlow! This guide will help you get started.

## Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL or Supabase account
- Git

### Getting Started

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/khanflow.git
   cd khanflow
   ```

2. **Install Dependencies**
   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../new-frontend
   npm install
   ```

3. **Configure Environment**
   - Copy `.env.example` files to `.env` in both directories
   - Fill in your development credentials
   - See [docs/setup](docs/setup) for detailed configuration

4. **Set Up Database**
   ```bash
   cd backend
   npm run db:setup
   ```

5. **Run Development Servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd new-frontend
   npm run dev
   ```

## Development Workflow

### Branch Naming

- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/what-changed` - Documentation updates
- `refactor/what-changed` - Code refactoring
- `test/what-tested` - Test additions/updates

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
feat: add voice command for scheduling meetings
fix: resolve timezone conversion bug in availability
docs: update OAuth setup guide
refactor: simplify meeting service logic
test: add unit tests for suggestion algorithm
```

### Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Use Prettier (if configured)
- **Linting**: Run `npm run lint` before committing
- **Type Safety**: No `any` types unless absolutely necessary

### Making Changes

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clear, self-documenting code
   - Add comments for complex logic
   - Update types and interfaces

3. **Test your changes**
   ```bash
   # Backend tests
   cd backend
   npm test

   # Frontend tests
   cd new-frontend
   npm run test:e2e
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## Testing Guidelines

### Backend Tests
- Unit tests for services and utilities
- Integration tests for API endpoints
- Test file naming: `*.test.ts`

```typescript
// Example test structure
describe('MeetingService', () => {
  it('should create a meeting with valid data', async () => {
    // Test implementation
  });
});
```

### Frontend Tests
- E2E tests with Playwright
- Component tests (if applicable)
- Test file naming: `*.test.tsx` or `*.spec.ts`

## Pull Request Process

1. **Update Documentation**
   - Update README if needed
   - Add/update inline code comments
   - Update relevant docs in `/docs`

2. **Ensure Tests Pass**
   ```bash
   npm test
   ```

3. **Create Pull Request**
   - Clear title and description
   - Reference any related issues
   - Include screenshots for UI changes
   - List breaking changes (if any)

4. **PR Template**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Unit tests pass
   - [ ] E2E tests pass
   - [ ] Manual testing completed

   ## Screenshots (if applicable)

   ## Related Issues
   Closes #123
   ```

5. **Code Review**
   - Address reviewer feedback
   - Keep discussions focused and professional
   - Be open to suggestions

## Project Structure

```
khanflow/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── services/       # Business logic
│   │   ├── models/         # Database models
│   │   ├── middlewares/    # Express middlewares
│   │   ├── routes/         # API routes
│   │   └── utils/          # Utility functions
│   └── tests/              # Backend tests
├── new-frontend/
│   ├── app/                # Next.js app router
│   ├── components/         # React components
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilities and configs
│   └── tests/              # E2E tests
└── docs/                   # Documentation
```

## Code Review Checklist

Before submitting your PR, ensure:

- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] No console.logs or debugging code
- [ ] Types are properly defined
- [ ] Error handling is implemented
- [ ] Environment variables are documented
- [ ] Breaking changes are documented
- [ ] Performance impact considered
- [ ] Security implications reviewed

## Common Tasks

### Adding a New API Endpoint

1. Create route in `backend/src/routes/`
2. Add controller in `backend/src/controllers/`
3. Implement service logic in `backend/src/services/`
4. Add tests in `backend/tests/`
5. Update API documentation

### Adding a New Frontend Feature

1. Create component in `new-frontend/components/`
2. Add route in `new-frontend/app/`
3. Implement API calls in `new-frontend/lib/api.ts`
4. Add types in `new-frontend/lib/types.ts`
5. Write E2E tests

### Working with Database

1. Create migration script (if needed)
2. Update database utilities
3. Test with development database
4. Document schema changes

## Getting Help

- **Documentation**: Check `/docs` directory
- **Issues**: Search existing GitHub issues
- **Questions**: Open a discussion on GitHub

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Keep discussions professional

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to KhanFlow! 🎉
