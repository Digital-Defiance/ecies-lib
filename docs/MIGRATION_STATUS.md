# ECIES v2.0 Migration Status

## Completed ✅

### Phase 1: i18n 2.0 Migration
- [x] Create `i18n-setup-v2.ts` with i18n 2.0 patterns
- [x] Update `test-setup.ts` to use `PluginI18nEngine.resetAll()`
- [x] Create unified `CryptoError` class
- [x] Create `CryptoErrorCode` enum
- [x] Create `ResultBuilder` for Result pattern
- [x] Create `CryptoContainer` for dependency injection
- [x] Create `ECIESBuilder` fluent API
- [x] Create `MemberBuilder` fluent API
- [x] Organize into modern folder structure:
  - `src/core/errors/` - Error classes
  - `src/core/types/` - Type definitions
  - `src/builders/` - Fluent builders
  - `src/lib/` - Library utilities

## In Progress 🚧

### Phase 1: i18n 2.0 Migration (Continued)
- [ ] Complete all translation mappings in `i18n-setup-v2.ts`
- [ ] Migrate error classes to use `CryptoError`:
  - [ ] `errors/ecies.ts` → Use `CryptoError`
  - [ ] `errors/member.ts` → Use `CryptoError`
  - [ ] `errors/pbkdf2.ts` → Use `CryptoError`
  - [ ] `errors/guid.ts` → Use `CryptoError`
  - [ ] `errors/secure-storage.ts` → Use `CryptoError`
  - [ ] `errors/invalid-email.ts` → Use `CryptoError`
- [ ] Update all services to use `getEciesI18nEngine()`
- [ ] Update all tests to use new error patterns

## Pending 📋

### Phase 2: Service Container
- [ ] Implement service registration in `CryptoContainer`
- [ ] Migrate `ECIESService` to use container
- [ ] Migrate `Pbkdf2Service` to use container
- [ ] Migrate `AESGCMService` to use container
- [ ] Migrate `PasswordLoginService` to use container
- [ ] Migrate `EciesFileService` to use container
- [ ] Update examples to use container

### Phase 3: Fluent Builders
- [ ] Complete `ECIESBuilder.build()` implementation
- [ ] Complete `MemberBuilder.build()` implementation
- [ ] Create `EncryptionPipeline` builder
- [ ] Create `DecryptionPipeline` builder
- [ ] Add builder examples to README

### Phase 4: Result Pattern
- [ ] Add `*Safe` methods to services
- [ ] Update service methods to return `CryptoResult<T>`
- [ ] Add Result pattern examples
- [ ] Mark throwing methods as deprecated

### Phase 5: Documentation
- [ ] Update README with v2 patterns
- [ ] Create MIGRATION_V2.md guide
- [ ] Add examples for all new patterns
- [ ] Update API documentation

## File Organization

### New Structure
```
src/
├── core/
│   ├── errors/
│   │   └── crypto-error.ts          ✅ Created
│   ├── types/
│   │   └── result.ts                ✅ Created
│   └── index.ts                     ✅ Created
├── builders/
│   ├── ecies-builder.ts             ✅ Created
│   ├── member-builder.ts            ✅ Created
│   └── index.ts                     ✅ Created
├── lib/
│   ├── crypto-container.ts          ✅ Created
│   └── index.ts                     ✅ Created
├── i18n-setup-v2.ts                 ✅ Created
└── [existing files...]
```

### Legacy Files (To Be Migrated)
```
src/
├── errors/                          🚧 Migrate to CryptoError
│   ├── ecies.ts
│   ├── member.ts
│   ├── pbkdf2.ts
│   ├── guid.ts
│   └── ...
├── services/                        📋 Migrate to use container
│   ├── ecies/
│   ├── pbkdf2.ts
│   └── ...
└── i18n-setup.ts                    🔄 Replace with i18n-setup-v2.ts
```

## Next Steps

1. **Complete i18n translations** - You will move over complete i18n-setup
2. **Migrate error classes** - Update to use `CryptoError`
3. **Update services** - Use `getEciesI18nEngine()` and container
4. **Update tests** - Use new patterns and verify all pass
5. **Complete builders** - Implement build() methods
6. **Add Result pattern** - Create *Safe methods
7. **Documentation** - Update README and create migration guide

## Testing Strategy

- Keep existing tests working during migration
- Add new tests for v2 patterns
- Use `PluginI18nEngine.resetAll()` in test setup
- Verify backward compatibility where maintained

## Timeline

- Week 1-2: Complete Phase 1 (i18n 2.0) ← **Current**
- Week 3-4: Phase 2 (Service Container) + Phase 3 (Builders)
- Week 5-6: Phase 4 (Result Pattern) + Phase 5 (Documentation)
- Week 7: Testing and refinement
- Week 8: Release 2.0.0-beta.1
