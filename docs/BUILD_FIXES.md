# Build Fixes Applied

## Completed ✅

1. **Renamed i18n-setup-v2.ts → i18n-setup.ts**
   - Old i18n-setup.ts moved to i18n-setup.ts.old
   
2. **Fixed ECIESBuilder**
   - Changed `IEciesConsts` → `IECIESConstants`
   - Added `<string>` generic to PluginI18nEngine

3. **Fixed DisposedError**
   - Updated to use `getCoreI18nEngine()` from i18n 2.0
   - Fixed translate call to include componentId

4. **Fixed CryptoContainer**
   - Added `<string>` generic to all PluginI18nEngine references

5. **Fixed i18n-setup.ts**
   - Added `<string>` generic to all PluginI18nEngine references

## Remaining Issues 🚧

### Error Classes Need Migration
All error classes still use old `PluginTypedHandleableError` with 3 generics.
i18n 2.0 only uses 2 generics (removed TLanguage).

Files to fix:
- `src/errors/ecies.ts`
- `src/errors/guid.ts`
- `src/errors/invalid-email.ts`
- `src/errors/length.ts`
- `src/errors/member.ts`
- `src/errors/pbkdf2.ts`
- `src/errors/secure-storage.ts`
- `src/errors/simple-ecies.ts`
- `src/services/password-login.ts`

### Next Steps
1. Migrate error classes to use new CryptoError (v2 pattern)
2. Or update to use 2-generic PluginTypedHandleableError
3. Fix guid.ts property access (error.type)
