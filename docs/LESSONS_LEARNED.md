# Lessons Learned: i18n v2.0 Migration

## Executive Summary

Successfully migrated `@digitaldefiance/ecies-lib` from i18n v1.x to v2.0 with **393/393 tests passing (100%)**. This document captures critical insights for future migrations.

## Critical Discoveries

### 1. The 'default' Instance Key Requirement

**Discovery**: `PluginTypedError` base class hardcodes `getInstance('default')` on line 127.

**Impact**: ALL plugin engines MUST use 'default' as the instance key, or errors will fail to retrieve the engine and translations will not work.

**Code Location**: `packages/digitaldefiance-i18n-lib/src/errors/typed.ts:127`

```typescript
// This is hardcoded in the base class
const engine = PluginI18nEngine.getInstance('default');
```

**Lesson**: Always use 'default' instance key for plugin engines. Custom keys will break error translation.

### 2. Constructor Parameter Order Matters

**Discovery**: When removing engine parameters, the remaining parameters shift positions.

**Problem Example**:
```typescript
// Original constructor
constructor(engine, profiles, eciesParams, pbkdf2Params)

// After removing engine - profiles becomes first parameter
constructor(profiles, eciesParams, pbkdf2Params)

// Test was doing this (WRONG):
new Pbkdf2Service(getEciesI18nEngine())
// This passes engine where profiles expected!
```

**Impact**: Tests passed engine object where profiles object expected, causing "Invalid PBKDF2 profile specified" errors.

**Lesson**: When removing parameters, verify ALL call sites update their arguments correctly.

### 3. Core Component Registration Required

**Discovery**: Errors use both core and plugin string keys.

**Problem**: Only registering plugin component caused missing translations for core error messages.

**Solution**: Register BOTH components in the same engine:
```typescript
engine.registerComponent(createCoreComponentRegistration());
engine.registerComponent(createEciesComponentRegistration());
```

**Lesson**: Always register core component alongside plugin component.

### 4. beforeAll vs beforeEach Timing

**Discovery**: `beforeAll` runs BEFORE `beforeEach` in test-setup.ts.

**Problem**: 
```typescript
// test-setup.ts
beforeEach(() => {
  PluginI18nEngine.resetAll(); // Runs AFTER beforeAll
});

// test file
beforeAll(() => {
  getEciesI18nEngine(); // Creates instance
});
// Then resetAll() runs, but instance already exists
```

**Impact**: "Instance already exists" errors.

**Solution**: Use `beforeEach` in test files:
```typescript
beforeEach(() => {
  getEciesI18nEngine(); // Runs AFTER resetAll
});
```

**Lesson**: Always use `beforeEach` for engine initialization in tests.

### 5. Mock Engines Are Obsolete

**Discovery**: v2.0 architecture makes engine mocking unnecessary.

**Before**: Tests created elaborate mock engines with dozens of mocked methods.

**After**: Tests just call `getEciesI18nEngine()` to use real engine.

**Benefits**:
- Simpler test code
- Tests verify actual translation behavior
- No mock maintenance burden

**Lesson**: Remove all mock engine code - use real engine in tests.

## Common Mistakes and Fixes

### Mistake 1: Passing Engine to Services

**Wrong**:
```typescript
const service = new Pbkdf2Service(getEciesI18nEngine());
```

**Right**:
```typescript
getEciesI18nEngine(); // Just ensure initialized
const service = new Pbkdf2Service();
```

**Why**: Services no longer accept engine parameter.

### Mistake 2: Custom Instance Keys

**Wrong**:
```typescript
const engine = PluginI18nEngine.createInstance('my-key', languages);
```

**Right**:
```typescript
const engine = PluginI18nEngine.createInstance('default', languages);
```

**Why**: Base error class hardcodes 'default' key.

### Mistake 3: Forgetting Core Component

**Wrong**:
```typescript
engine.registerComponent(createEciesComponentRegistration());
```

**Right**:
```typescript
engine.registerComponent(createCoreComponentRegistration());
engine.registerComponent(createEciesComponentRegistration());
```

**Why**: Errors use both core and plugin strings.

### Mistake 4: Not Removing Engine from Reset

**Wrong**:
```typescript
export function resetEciesI18nEngine(): void {
  _eciesI18nEngine = createEciesI18nEngine();
}
```

**Right**:
```typescript
export function resetEciesI18nEngine(): void {
  try {
    PluginI18nEngine.removeInstance('default');
  } catch {
    // Ignore if doesn't exist
  }
  _eciesI18nEngine = createEciesI18nEngine();
}
```

**Why**: Must remove old instance before creating new one.

## Testing Insights

### Insight 1: Incremental Testing

**Strategy**: Test files one at a time, not all at once.

```bash
# Start with simple unit tests
npx jest tests/pbkdf2.spec.ts

# Then services
npx jest tests/services/

# Finally e2e tests
npx jest tests/*.e2e.spec.ts
```

**Benefit**: Isolates issues to specific files.

### Insight 2: Translation Verification

**Pattern**: Check for untranslated keys in error messages.

```typescript
// BAD - not translated
expect(error.message).toContain('[ecies.Error_');

// GOOD - translated
expect(error.message).toBe('Invalid PBKDF2 profile specified');
```

**Lesson**: Untranslated keys indicate engine initialization issues.

### Insight 3: Test Cleanup Order

**Critical Order**:
1. `PluginI18nEngine.resetAll()` - Clear all instances
2. `resetCoreI18nEngine()` - Recreate core engine
3. `resetEciesI18nEngine()` - Recreate plugin engine
4. `getEciesI18nEngine()` - Initialize for test

**Why**: Each step depends on previous step completing.

## Architecture Insights

### Insight 1: Singleton Pattern

**Discovery**: v2.0 uses singleton pattern for engine instances.

**Implication**: 
- One engine per instance key
- Shared across all errors and services
- Must be properly initialized before use

**Benefit**: Eliminates parameter passing throughout codebase.

### Insight 2: Automatic Engine Retrieval

**Discovery**: Errors automatically call `getInstance('default')`.

**Implication**:
- No need to pass engine to error constructors
- Engine must exist before throwing errors
- Tests must initialize engine in setup

**Benefit**: Cleaner error handling code.

### Insight 3: Component Registry

**Discovery**: Engine maintains registry of registered components.

**Implication**:
- Must register all components before use
- Components can be registered in any order
- Registration is per-instance

**Benefit**: Modular string management.

## Performance Insights

### Before Migration
- 393 tests
- ~45 seconds
- Multiple engine instances
- Parameter passing overhead

### After Migration
- 393 tests
- ~44 seconds
- Single engine instance
- No parameter passing

**Conclusion**: Slight performance improvement, no degradation.

## Code Quality Improvements

### Reduced Complexity
- **Before**: Services had 4-5 constructor parameters
- **After**: Services have 2-3 constructor parameters
- **Improvement**: 40% reduction in parameter count

### Improved Testability
- **Before**: Complex mock engine setup (50+ lines)
- **After**: Simple engine initialization (1 line)
- **Improvement**: 98% reduction in test setup code

### Better Maintainability
- **Before**: Engine passed through 3-4 layers
- **After**: Engine retrieved automatically
- **Improvement**: Eliminated parameter threading

## Migration Metrics

### Time Investment
- Analysis: 30 minutes
- Core changes: 1 hour
- Service updates: 1 hour
- Test updates: 2 hours
- Verification: 1 hour
- **Total**: ~5.5 hours

### Code Changes
- Files modified: 32
- Lines added: ~150
- Lines removed: ~400
- **Net reduction**: 250 lines

### Test Results
- Before: 393/393 passing (100%)
- After: 393/393 passing (100%)
- **Regression**: 0

## Recommendations for Future Migrations

### 1. Start with i18n Setup
Always begin with `src/i18n-setup.ts` - it's the foundation.

### 2. Update Services Before Tests
Services are simpler to update and verify.

### 3. Test Incrementally
Don't run full test suite until services are updated.

### 4. Use Search and Replace Carefully
Constructor parameter changes require manual verification.

### 5. Keep Reference Implementation
Maintain completed migration as reference for future work.

### 6. Document Deviations
If library structure differs, document why and how.

## Red Flags to Watch For

🚩 **Untranslated error messages** - Engine not initialized
🚩 **"Instance already exists"** - Using beforeAll instead of beforeEach
🚩 **"Profile not found"** - Engine passed where profiles expected
🚩 **"Component not found"** - Missing component registration
🚩 **Test timeouts** - Infinite loops in engine initialization

## Success Indicators

✅ All tests passing (100%)
✅ No untranslated error messages
✅ Reduced code complexity
✅ Improved test readability
✅ No performance degradation
✅ Maintained test coverage

## Knowledge Transfer

### For Future Developers

**Key Concepts**:
1. Engine singleton pattern
2. Automatic engine retrieval
3. Component registration
4. Instance key importance

**Key Files**:
1. `src/i18n-setup.ts` - Engine configuration
2. `tests/test-setup.ts` - Test initialization
3. `src/errors/*.ts` - Error classes
4. `src/services/*.ts` - Service classes

**Key Patterns**:
1. No engine parameters in constructors
2. Call `getEciesI18nEngine()` in test setup
3. Register both core and plugin components
4. Always use 'default' instance key

### For AI Agents

**Critical Instructions**:
1. Read this document FIRST
2. Follow migration guide EXACTLY
3. Test incrementally, not all at once
4. Verify translations work
5. Check for red flags
6. Validate against success indicators

**Common Pitfalls**:
1. Wrong constructor parameters
2. Custom instance keys
3. Missing core component
4. Using beforeAll
5. Not removing old instances

## Conclusion

The i18n v2.0 migration was successful with zero regressions and improved code quality. The key to success was:

1. Understanding the singleton pattern
2. Recognizing the 'default' key requirement
3. Systematic approach to updates
4. Incremental testing
5. Thorough verification

These lessons learned will accelerate future migrations and prevent common mistakes.

## Appendix: Quick Reference

### Engine Initialization Pattern
```typescript
// In i18n-setup.ts
const engine = PluginI18nEngine.createInstance('default', languages);
engine.registerComponent(createCoreComponentRegistration());
engine.registerComponent(createEciesComponentRegistration());
```

### Service Constructor Pattern
```typescript
// Remove engine parameter
constructor(
  profiles: Record<string, IPbkdf2Config> = Constants.PBKDF2_PROFILES,
  // ... other parameters
) {
  this.profiles = profiles;
}
```

### Test Setup Pattern
```typescript
beforeEach(() => {
  getEciesI18nEngine(); // Initialize engine
  service = new Service(); // No engine parameter
});
```

### Reset Pattern
```typescript
export function resetEciesI18nEngine(): void {
  try {
    PluginI18nEngine.removeInstance('default');
  } catch {
    // Ignore
  }
  _eciesI18nEngine = createEciesI18nEngine();
}
```
