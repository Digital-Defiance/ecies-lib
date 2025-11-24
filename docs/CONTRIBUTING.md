# Contributing to @digitaldefiance/ecies-lib

Thank you for your interest in contributing to the Digital Defiance ECIES library! This document provides guidelines and best practices for contributors.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Module Dependency Rules](#module-dependency-rules)
- [Code Style](#code-style)
- [Testing](#testing)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Yarn package manager
- Git

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ecies-lib.git
   cd ecies-lib
   ```
3. Install dependencies:
   ```bash
   yarn install
   ```
4. Build the project:
   ```bash
   yarn build
   ```
5. Run tests to verify setup:
   ```bash
   yarn test
   ```

## Development Workflow

### Branch Naming

Use descriptive branch names:
- `feature/add-new-cipher` - New features
- `fix/circular-dependency` - Bug fixes
- `docs/update-readme` - Documentation updates
- `refactor/improve-error-handling` - Code refactoring

### Commit Messages

Follow conventional commit format:
```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(encryption): add support for AES-192

Implements AES-192 encryption mode alongside existing AES-256.
Includes tests and documentation updates.

Closes #123
```

```
fix(enumerations): remove circular dependency in ecies-encryption-type

Moved validation functions to utils/encryption-type-utils.ts
to break circular dependency chain.

Fixes #456
```

## Module Dependency Rules

**CRITICAL:** This library maintains a strict module hierarchy to prevent circular dependencies. Violating these rules will cause runtime errors.

### The 5-Level Hierarchy

```
Level 1: Enumerations (Pure, no dependencies)
    ↓
Level 2: Translations (Depends only on Level 1)
    ↓
Level 3: i18n Setup (Depends on Levels 1-2)
    ↓
Level 4: Errors & Utilities (Depends on Levels 1-3)
    ↓
Level 5: Constants & Services (Depends on Levels 1-4)
```

### Import Rules by Module Type

#### Enumerations (`src/enumerations/*.ts`)

✅ **CAN** import:
- TypeScript types only

❌ **CANNOT** import:
- Translations
- i18n setup
- Errors
- Constants
- Services
- Utilities

**Example:**
```typescript
// ✅ GOOD
export enum EciesEncryptionTypeEnum {
  Simple = 33,
  Single = 66,
  Multiple = 99,
}

// ❌ BAD - Don't do this!
import { ECIESError } from '../errors/ecies'; // Circular dependency!
```

#### Translations (`src/translations/*.ts`)

✅ **CAN** import:
- Enumerations (Level 1)
- External libraries

❌ **CANNOT** import:
- i18n setup
- Errors
- Constants
- Services

#### i18n Setup (`src/i18n-setup.ts`)

✅ **CAN** import:
- Enumerations (Level 1)
- Translations (Level 2)
- External libraries

❌ **CANNOT** import:
- Errors
- Constants
- Services

#### Errors (`src/errors/*.ts`)

✅ **CAN** import:
- Enumerations (Level 1)
- i18n setup (Level 3)
- External libraries

❌ **CANNOT** import:
- Constants
- Services (except as lazy imports)

⚠️ **MUST** use lazy i18n initialization:
```typescript
// ✅ GOOD - Lazy initialization
export class ECIESError extends TypedHandleableError {
  constructor(type: ECIESErrorTypeEnum) {
    super(type); // Don't access i18n here
  }
  
  get message(): string {
    const engine = getEciesI18nEngine(); // Lazy access
    return engine.translate(EciesComponentId, getKeyForType(this.type));
  }
}

// ❌ BAD - Eager initialization
export class ECIESError extends Error {
  constructor(type: ECIESErrorTypeEnum) {
    const engine = getEciesI18nEngine(); // May not be ready!
    super(engine.translate(EciesComponentId, getKeyForType(type)));
  }
}
```

#### Utilities (`src/utils/*.ts`)

✅ **CAN** import:
- Enumerations (Level 1)
- i18n setup (Level 3)
- Errors (Level 4)
- External libraries

❌ **CANNOT** import:
- Constants
- Services (except as lazy imports)

#### Constants (`src/constants.ts`)

✅ **CAN** import:
- Enumerations (Level 1)
- Errors (Level 4)
- Utilities (Level 4)
- External libraries

❌ **CANNOT** import:
- Services

⚠️ **MUST** handle early initialization errors gracefully:
```typescript
// ✅ GOOD - Safe translation with fallback
function safeTranslate(key: EciesStringKey, fallback: string): string {
  try {
    const engine = getEciesI18nEngine();
    return engine.translate(EciesComponentId, key);
  } catch {
    return fallback;
  }
}

// ❌ BAD - Hard dependency on i18n
function validateConstants(config: IConstants): void {
  const engine = getEciesI18nEngine(); // May fail!
  throw new Error(engine.translate(...));
}
```

#### Services (`src/services/**/*.ts`)

✅ **CAN** import:
- All of the above levels

⚠️ **SHOULD** avoid circular dependencies with other services

### Checking for Circular Dependencies

Before committing, always check for circular dependencies:

```bash
# Check entire project
npx madge --circular --extensions ts src/index.ts

# Check specific module
npx madge --circular --extensions ts src/enumerations/index.ts

# Generate visual graph
npx madge --image graph.svg --extensions ts src/index.ts
```

If you see circular dependencies, you **must** fix them before submitting a PR.

## Code Style

### TypeScript

- Use TypeScript strict mode
- Avoid `any` types - use proper typing
- Use interfaces for public APIs
- Use types for internal structures
- Document public APIs with JSDoc comments

### Formatting

The project uses Prettier and ESLint:

```bash
# Check formatting
yarn lint

# Fix formatting issues
yarn format
```

### Naming Conventions

- **Files**: kebab-case (`ecies-encryption-type.ts`)
- **Classes**: PascalCase (`ECIESService`)
- **Interfaces**: PascalCase with `I` prefix (`IConstants`)
- **Enums**: PascalCase with `Enum` suffix (`EciesEncryptionTypeEnum`)
- **Functions**: camelCase (`validateEciesEncryptionTypeEnum`)
- **Constants**: UPPER_SNAKE_CASE (`ECIES_VERSION`)
- **Private members**: camelCase with `_` prefix (`_privateMethod`)

## Testing

### Test Requirements

All contributions must include tests:

- **Unit tests** for new functions and classes
- **Integration tests** for new features
- **Property-based tests** for universal properties
- **E2E tests** for cross-platform compatibility (if applicable)

### Running Tests

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test --watch

# Run tests with coverage
yarn test --coverage

# Run specific test file
yarn test src/services/ecies/service.spec.ts
```

### Writing Tests

#### Unit Tests

```typescript
describe('ECIESService', () => {
  it('should encrypt and decrypt data', async () => {
    const ecies = new ECIESService();
    const { privateKey, publicKey } = ecies.generateKeyPair();
    const message = new TextEncoder().encode('test');
    
    const encrypted = await ecies.encryptSimpleOrSingle(false, publicKey, message);
    const decrypted = await ecies.decryptSimpleOrSingleWithHeader(false, privateKey, encrypted);
    
    expect(decrypted).toEqual(message);
  });
});
```

#### Property-Based Tests

Use `fast-check` for property-based testing:

```typescript
import * as fc from 'fast-check';

test('encryption preserves message length', () => {
  fc.assert(
    fc.property(
      fc.uint8Array({ minLength: 1, maxLength: 1000 }),
      async (message) => {
        const ecies = new ECIESService();
        const { privateKey, publicKey } = ecies.generateKeyPair();
        
        const encrypted = await ecies.encryptSimpleOrSingle(false, publicKey, message);
        const decrypted = await ecies.decryptSimpleOrSingleWithHeader(false, privateKey, encrypted);
        
        expect(decrypted.length).toBe(message.length);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Coverage

Maintain high test coverage:
- Aim for >90% line coverage
- Aim for >85% branch coverage
- All public APIs must be tested
- All error paths must be tested

## Documentation

### Code Documentation

Use JSDoc for public APIs:

```typescript
/**
 * Encrypts data using ECIES with the specified public key.
 * 
 * @param isSingle - Whether to use single-recipient mode (includes length prefix)
 * @param publicKey - The recipient's public key (33 bytes compressed)
 * @param data - The data to encrypt
 * @returns The encrypted data including header and ciphertext
 * @throws {ECIESError} If encryption fails or inputs are invalid
 * 
 * @example
 * ```typescript
 * const ecies = new ECIESService();
 * const encrypted = await ecies.encryptSimpleOrSingle(
 *   false,
 *   recipientPublicKey,
 *   new TextEncoder().encode('Hello')
 * );
 * ```
 */
async encryptSimpleOrSingle(
  isSingle: boolean,
  publicKey: Uint8Array,
  data: Uint8Array
): Promise<Uint8Array> {
  // Implementation
}
```

### README Updates

Update the README when:
- Adding new features
- Changing public APIs
- Adding new dependencies
- Changing installation or setup procedures

### Architecture Documentation

Update architecture docs when:
- Changing module structure
- Adding new module types
- Modifying dependency rules
- Refactoring major components

## Pull Request Process

### Before Submitting

1. **Run all checks:**
   ```bash
   yarn lint
   yarn test
   npx madge --circular --extensions ts src/index.ts
   ```

2. **Update documentation:**
   - Update README if needed
   - Add JSDoc comments to new public APIs
   - Update CHANGELOG.md

3. **Write clear commit messages:**
   - Follow conventional commit format
   - Reference related issues

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Property-based tests added/updated
- [ ] All tests passing
- [ ] No circular dependencies

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Dependent changes merged

## Related Issues
Closes #123
```

### Review Process

1. Automated checks must pass (CI/CD)
2. At least one maintainer approval required
3. No unresolved conversations
4. Branch must be up to date with main

### After Merge

- Delete your branch
- Update your fork
- Close related issues

## Questions?

If you have questions:
- Check existing documentation
- Search closed issues
- Open a new issue with the `question` label
- Join our community discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Code of Conduct

Be respectful, inclusive, and professional. We're all here to build great software together.

---

Thank you for contributing to @digitaldefiance/ecies-lib! 🎉
