# Migration Guide: @digitaldefiance/node-ecies-lib to i18n v2.0

## For Amazon Q Agent

This document provides step-by-step instructions for migrating `@digitaldefiance/node-ecies-lib` to i18n v2.0, based on lessons learned from successfully migrating `@digitaldefiance/ecies-lib`.

## Prerequisites

- Read [I18N_V2_MIGRATION_GUIDE.md](./I18N_V2_MIGRATION_GUIDE.md) first
- Understand the parallel structure between the two libraries
- Have access to both package directories

## Library Comparison

### Similarities
Both libraries share:
- ECIES encryption/decryption services
- PBKDF2 key derivation
- Error handling with i18n
- Similar test structure
- Same string keys (EciesStringKey enum)

### Differences
- **node-ecies-lib**: Node.js-specific crypto APIs
- **ecies-lib**: Browser-compatible Web Crypto API

## Migration Plan

### Phase 1: Analysis (30 minutes)

#### 1.1 Identify Files to Modify

Run these commands to find files that need changes:

```bash
cd packages/digitaldefiance-node-ecies-lib

# Find files importing i18n engine
grep -r "I18nEngine" src/ tests/

# Find service constructors with engine parameters
grep -r "constructor.*engine" src/services/

# Find error instantiations with engine
grep -r "new.*Error.*engine" src/ tests/
```

#### 1.2 Expected Files

Based on ecies-lib migration, expect to modify:

**Core Files**:
- `src/i18n-setup.ts` - Main i18n configuration
- `src/index.ts` - Export consolidation
- `tests/test-setup.ts` - Test initialization

**Service Files**:
- `src/services/pbkdf2.ts` - Remove engine parameter
- `src/services/password-login.ts` - Remove engine parameter
- Any other services accepting engine

**Test Files**:
- `tests/pbkdf2.spec.ts`
- `tests/pbkdf2-lib.e2e.spec.ts`
- `tests/password-login.spec.ts`
- `tests/password-login.e2e.spec.ts`
- `tests/i18n-error-translation.spec.ts`
- All other test files that instantiate services

### Phase 2: Core i18n Setup (1 hour)

#### 2.1 Update src/i18n-setup.ts

**Critical Changes**:

1. Change instance key to 'default':
```typescript
// Find this line:
const EciesI18nEngineKey = 'DigitalDefiance.NodeEcies.I18nEngine';

// Replace with:
const DefaultInstanceKey = 'default';
```

2. Update createEciesI18nEngine function:
```typescript
export function createEciesI18nEngine(
  instanceKey: string = DefaultInstanceKey,
): PluginI18nEngine<string> {
  const languages = createDefaultLanguages();
  const engine = PluginI18nEngine.createInstance<string>(
    instanceKey,
    languages,
  );
  
  // CRITICAL: Register BOTH components
  engine.registerComponent(createCoreComponentRegistration());
  engine.registerComponent(createEciesComponentRegistration());
  
  return engine;
}
```

3. Update reset function:
```typescript
export function resetEciesI18nEngine(): void {
  try {
    PluginI18nEngine.removeInstance('default');
  } catch {
    // Instance doesn't exist, ignore
  }
  _eciesI18nEngine = createEciesI18nEngine();
}
```

#### 2.2 Verify String Keys

Ensure `EciesStringKey` enum matches between libraries:

```bash
# Compare string keys
diff packages/digitaldefiance-ecies-lib/src/enumerations/ecies-string-key.ts \
     packages/digitaldefiance-node-ecies-lib/src/enumerations/ecies-string-key.ts
```

If differences exist, synchronize them.

### Phase 3: Service Updates (1 hour)

#### 3.1 Update Pbkdf2Service

**File**: `src/services/pbkdf2.ts`

**Before**:
```typescript
export class Pbkdf2Service<TLanguage extends CoreLanguageCode> {
  protected readonly engine: PluginI18nEngine<TLanguage>;
  
  constructor(
    engine: PluginI18nEngine<TLanguage>,
    profiles?: Record<string, IPbkdf2Config>,
  ) {
    this.engine = engine;
    this.profiles = profiles ?? Constants.PBKDF2_PROFILES;
  }
}
```

**After**:
```typescript
export class Pbkdf2Service<TLanguage extends CoreLanguageCode> {
  protected readonly profiles: Record<string, IPbkdf2Config>;
  protected readonly eciesConsts: IECIESConstants;
  protected readonly pbkdf2Consts: IPBkdf2Consts;
  
  constructor(
    profiles: Record<string, IPbkdf2Config> = Constants.PBKDF2_PROFILES,
    eciesParams: IECIESConstants = Constants.ECIES,
    pbkdf2Params: IPBkdf2Consts = Constants.PBKDF2,
  ) {
    this.profiles = profiles;
    this.eciesConsts = eciesParams;
    this.pbkdf2Consts = pbkdf2Params;
  }
}
```

**Remove all `this.engine` references** - errors will get engine automatically.

#### 3.2 Update PasswordLoginService

**File**: `src/services/password-login.ts`

**Before**:
```typescript
constructor(
  eciesService: ECIESService,
  pbkdf2Service: Pbkdf2Service<TLanguage>,
  engine: PluginI18nEngine<TLanguage>,
  eciesParams?: IECIESConstants,
) {
  this.eciesService = eciesService;
  this.pbkdf2Service = pbkdf2Service;
  this.engine = engine;
  this.eciesConsts = eciesParams ?? Constants.ECIES;
}
```

**After**:
```typescript
constructor(
  eciesService: ECIESService,
  pbkdf2Service: Pbkdf2Service<TLanguage>,
  eciesParams: IECIESConstants = Constants.ECIES,
) {
  this.eciesService = eciesService;
  this.pbkdf2Service = pbkdf2Service;
  this.eciesConsts = eciesParams;
}
```

#### 3.3 Check Other Services

Search for any other services with engine parameters:

```bash
grep -n "engine.*PluginI18nEngine" src/services/*.ts
```

Apply the same pattern: remove engine parameter and references.

### Phase 4: Test Updates (2 hours)

#### 4.1 Update test-setup.ts

**File**: `tests/test-setup.ts`

Ensure proper cleanup:

```typescript
import { PluginI18nEngine } from '@digitaldefiance/i18n-lib';
import { resetCoreI18nEngine } from '@digitaldefiance/i18n-lib';
import { resetEciesI18nEngine, getEciesI18nEngine } from '../src/i18n-setup';

beforeEach(() => {
  // Reset all engines
  PluginI18nEngine.resetAll();
  resetCoreI18nEngine();
  resetEciesI18nEngine();
  
  // Initialize for tests
  getEciesI18nEngine();
});
```

#### 4.2 Update Unit Tests

**Pattern for all test files**:

```typescript
describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    getEciesI18nEngine(); // Ensure engine initialized
    service = new MyService(); // NO engine parameter
  });
});
```

**Files to update**:
- `tests/pbkdf2.spec.ts`
- `tests/password-login.spec.ts`
- `tests/services/**/*.spec.ts`
- `tests/error-coverage.spec.ts`
- `tests/errors/errors.spec.ts`

**Search and replace pattern**:
```bash
# Find all service instantiations with engine
grep -n "new.*Service.*getEciesI18nEngine()" tests/**/*.ts

# Each needs manual review and fix
```

#### 4.3 Update E2E Tests

**Critical Fix for password-login.e2e.spec.ts**:

```typescript
// BEFORE - WRONG
beforeEach(() => {
  eciesService = new ECIESService();
  pbkdf2Service = new Pbkdf2Service(getEciesI18nEngine());
  passwordLoginService = new PasswordLoginService(
    eciesService, 
    pbkdf2Service, 
    getEciesI18nEngine()
  );
});

// AFTER - CORRECT
beforeEach(() => {
  getEciesI18nEngine(); // Just initialize
  eciesService = new ECIESService();
  pbkdf2Service = new Pbkdf2Service();
  passwordLoginService = new PasswordLoginService(
    eciesService, 
    pbkdf2Service
  );
});
```

**Files to update**:
- `tests/pbkdf2-lib.e2e.spec.ts`
- `tests/password-login.e2e.spec.ts`
- Any other e2e test files

#### 4.4 Remove Mock Engines

Search for mock engine setup:

```bash
grep -n "mockEngine" tests/**/*.ts
```

**Before**:
```typescript
let mockEngine: jest.Mocked<I18nEngine<...>>;

beforeEach(() => {
  mockEngine = {
    translate: jest.fn().mockImplementation(...),
    // ... many lines of mocking
  };
  service = new Service(mockEngine);
});
```

**After**:
```typescript
beforeEach(() => {
  getEciesI18nEngine(); // Real engine, no mocking
  service = new Service();
});
```

### Phase 5: Verification (1 hour)

#### 5.1 Run Tests Incrementally

```bash
# Test one file at a time
npx jest tests/pbkdf2.spec.ts
npx jest tests/password-login.spec.ts

# Test by directory
npx jest tests/services/

# Run all tests
yarn test
```

#### 5.2 Check for Common Errors

**Error 1: "Invalid PBKDF2 profile specified"**
- **Cause**: Engine passed where profiles expected
- **Fix**: Remove engine parameter from Pbkdf2Service constructor

**Error 2: Untranslated keys like `[ecies.Error_...]`**
- **Cause**: Engine not initialized or wrong instance key
- **Fix**: Ensure using 'default' key and both components registered

**Error 3: "Instance already exists"**
- **Cause**: Using beforeAll instead of beforeEach
- **Fix**: Change to beforeEach (runs after test-setup cleanup)

**Error 4: "Component not found"**
- **Cause**: Missing core or ecies component registration
- **Fix**: Register both components in createEciesI18nEngine

#### 5.3 Verify Translations

Add a test to verify translations work:

```typescript
it('should translate error messages', () => {
  const engine = getEciesI18nEngine();
  const translation = engine.translate(
    'ecies',
    EciesStringKey.Error_Pbkdf2Error_InvalidProfile
  );
  expect(translation).not.toContain('[ecies.');
  expect(translation).toBe('Invalid PBKDF2 profile specified');
});
```

### Phase 6: Cleanup (30 minutes)

#### 6.1 Remove Old Files

```bash
# Find backup files
find src/ -name "*.old" -o -name "*-v2.ts"

# Remove them
rm src/i18n-setup.ts.old
rm src/index-v2.ts  # If exists
```

#### 6.2 Update Index Exports

Merge any v2 exports into main index:

```typescript
/**
 * Node ECIES Library - Unified exports
 */

// V2 Architecture (if applicable)
export * from './core';
export * from './builders';
export * from './lib';

// Existing exports
export * from './constants';
export * from './errors';
export * from './i18n-setup';
export * from './services';
// ... all other exports
```

#### 6.3 Update Documentation

Update README.md to reflect v2.0 changes:
- Remove references to passing engine to services
- Update example code
- Add link to migration guide

### Phase 7: Final Validation (30 minutes)

#### 7.1 Run Full Test Suite

```bash
yarn test
```

**Expected Result**: 100% tests passing

#### 7.2 Check Test Coverage

```bash
yarn test --coverage
```

Ensure coverage hasn't decreased.

#### 7.3 Verify No Regressions

Compare test results before and after:

```bash
# Before migration
yarn test > before.log 2>&1

# After migration
yarn test > after.log 2>&1

# Compare
diff before.log after.log
```

Should show same number of passing tests.

## Troubleshooting Guide

### Issue: Tests Fail with "Cannot find module"

**Solution**: Check imports in test files
```typescript
// Ensure correct import
import { getEciesI18nEngine } from '../src/i18n-setup';
```

### Issue: "Profile not found" errors

**Solution**: Check Pbkdf2Service constructor calls
```typescript
// WRONG
new Pbkdf2Service(getEciesI18nEngine())

// CORRECT
new Pbkdf2Service()
```

### Issue: Translations not working

**Solution**: Verify engine initialization
```typescript
// In test-setup.ts
beforeEach(() => {
  PluginI18nEngine.resetAll();
  resetCoreI18nEngine();
  resetEciesI18nEngine();
  getEciesI18nEngine(); // MUST call this
});
```

### Issue: "Instance already exists"

**Solution**: Change beforeAll to beforeEach
```typescript
// WRONG
beforeAll(() => {
  getEciesI18nEngine();
});

// CORRECT
beforeEach(() => {
  getEciesI18nEngine();
});
```

## Validation Checklist

Use this checklist to verify migration completion:

- [ ] `src/i18n-setup.ts` uses 'default' instance key
- [ ] Core component registered in engine
- [ ] Ecies component registered in engine
- [ ] `Pbkdf2Service` constructor has no engine parameter
- [ ] `PasswordLoginService` constructor has no engine parameter
- [ ] All other services updated (if applicable)
- [ ] `test-setup.ts` properly resets engines
- [ ] All unit tests updated (no engine parameters)
- [ ] All e2e tests updated (no engine parameters)
- [ ] Mock engines removed from tests
- [ ] All tests passing (100%)
- [ ] No untranslated error messages
- [ ] Old backup files removed
- [ ] Index exports consolidated
- [ ] Documentation updated
- [ ] Test coverage maintained or improved

## Time Estimate

- **Phase 1 (Analysis)**: 30 minutes
- **Phase 2 (Core Setup)**: 1 hour
- **Phase 3 (Services)**: 1 hour
- **Phase 4 (Tests)**: 2 hours
- **Phase 5 (Verification)**: 1 hour
- **Phase 6 (Cleanup)**: 30 minutes
- **Phase 7 (Validation)**: 30 minutes

**Total**: ~6.5 hours

## Success Criteria

✅ All tests passing (100%)
✅ No untranslated error messages
✅ No engine parameters in service constructors
✅ No engine parameters in test files
✅ Both core and ecies components registered
✅ Using 'default' instance key
✅ Test coverage maintained
✅ Documentation updated

## Reference Implementation

For any questions, refer to the completed migration in:
- `packages/digitaldefiance-ecies-lib/src/i18n-setup.ts`
- `packages/digitaldefiance-ecies-lib/tests/test-setup.ts`
- `packages/digitaldefiance-ecies-lib/tests/password-login.e2e.spec.ts`

## Questions for Human Review

If you encounter issues not covered in this guide:

1. Does the service constructor signature match the pattern?
2. Are both components registered in the engine?
3. Is the 'default' instance key being used?
4. Are tests using beforeEach (not beforeAll)?
5. Have all mock engines been removed?

If all answers are "yes" and tests still fail, consult the human developer.
