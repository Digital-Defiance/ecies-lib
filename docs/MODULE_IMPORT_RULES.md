# Module Import Rules - Quick Reference

## The 5-Level Hierarchy

```
Level 1: Enumerations → Level 2: Translations → Level 3: i18n Setup → Level 4: Errors & Utils → Level 5: Constants & Services
```

## Import Rules Table

| Module Type | Location | ✅ CAN Import | ❌ CANNOT Import |
|------------|----------|---------------|------------------|
| **Enumerations** | `src/enumerations/*.ts` | TypeScript types only | Everything else |
| **Translations** | `src/translations/*.ts` | Enumerations, external libs | i18n, errors, constants, services |
| **i18n Setup** | `src/i18n-setup.ts` | Enumerations, translations, external libs | Errors, constants, services |
| **Errors** | `src/errors/*.ts` | Enumerations, i18n, external libs | Constants, services |
| **Utilities** | `src/utils/*.ts` | Enumerations, i18n, errors, external libs | Constants, services |
| **Constants** | `src/constants.ts` | Enumerations, errors, utils, external libs | Services |
| **Services** | `src/services/**/*.ts` | All of the above | Other services (avoid cycles) |

## Quick Checks

### Before Committing

```bash
# Check for circular dependencies
npx madge --circular --extensions ts src/index.ts
```

### Common Mistakes

❌ **DON'T** import errors in enumerations:
```typescript
// src/enumerations/ecies-encryption-type.ts
import { ECIESError } from '../errors/ecies'; // WRONG!
```

✅ **DO** move validation to utilities:
```typescript
// src/utils/encryption-type-utils.ts
import { ECIESError } from '../errors/ecies'; // CORRECT!
```

❌ **DON'T** use eager i18n in error constructors:
```typescript
constructor(type: ECIESErrorTypeEnum) {
  const engine = getEciesI18nEngine(); // WRONG!
  super(engine.translate(...));
}
```

✅ **DO** use lazy i18n via getters:
```typescript
constructor(type: ECIESErrorTypeEnum) {
  super(type); // CORRECT!
}

get message(): string {
  const engine = getEciesI18nEngine();
  return engine.translate(...);
}
```

## File Locations

| Module Type | Files |
|------------|-------|
| Enumerations | `src/enumerations/*.ts` |
| Translations | `src/translations/*.ts` |
| i18n Setup | `src/i18n-setup.ts` |
| Errors | `src/errors/*.ts` |
| Utilities | `src/utils/*.ts` |
| Constants | `src/constants.ts` |
| Services | `src/services/**/*.ts` |

## When in Doubt

1. Check the hierarchy level of your module
2. Check the hierarchy level of what you want to import
3. You can only import from lower levels (or same level for services)
4. Run `npx madge --circular` to verify

## More Information

- [Circular Dependency Prevention Guide](CIRCULAR_DEPENDENCY_PREVENTION.md) - Detailed guide
- [Contributing Guide](CONTRIBUTING.md) - Full contributor guidelines
- [ECIES V4 Architecture](ECIES_V4_ARCHITECTURE.md) - Overall architecture
