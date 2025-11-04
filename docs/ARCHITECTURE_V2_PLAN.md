# ECIES Library 2.0 Architecture Plan

## Executive Summary

Refactor `@digitaldefiance/ecies-lib` to align with i18n-lib 2.0 and express-suite 2.0 patterns:
- **50% complexity reduction** through simplified APIs
- **Fluent builders** for service configuration
- **Service container** for dependency injection
- **Unified error system** with error codes
- **i18n 2.0 integration** with runtime validation

## Phase 1: i18n 2.0 Migration (PRIORITY)

### 1.1 Update i18n Setup

**Current State** (`i18n-setup.ts`):
```typescript
// Uses legacy patterns with manual language definitions
export function initEciesI18nEngine() {
  const EciesComponent: ComponentDefinition<EciesStringKey> = { ... };
  // Manual translation objects for each language
}
```

**Target State**:
```typescript
import { PluginI18nEngine, createDefaultLanguages } from '@digitaldefiance/i18n-lib';

export function createEciesI18nEngine(instanceKey = EciesI18nEngineKey) {
  const engine = PluginI18nEngine.createInstance(instanceKey, createDefaultLanguages());
  engine.registerComponent(createEciesComponentRegistration());
  return engine;
}

// Lazy initialization with Proxy (like core-i18n.ts)
let _eciesEngine: PluginI18nEngine | undefined;
export function getEciesI18nEngine(): PluginI18nEngine {
  if (!_eciesEngine) _eciesEngine = createEciesI18nEngine();
  return _eciesEngine;
}

export const eciesI18nEngine = new Proxy({} as PluginI18nEngine, {
  get(target, prop) {
    return getEciesI18nEngine()[prop as keyof PluginI18nEngine];
  }
});
```

**Benefits**:
- Runtime language validation via registry
- No generic type parameters
- Automatic fallback to default language
- Consistent with i18n 2.0 patterns

### 1.2 Simplify String Key Registration

**Current**: 100+ individual string keys in enum
**Target**: Group by domain

```typescript
// ecies-string-key.ts - Keep enum but organize better
export enum EciesStringKey {
  // Encryption Errors
  Encryption_InvalidKeySize = 'Encryption_InvalidKeySize',
  Encryption_DecryptionFailed = 'Encryption_DecryptionFailed',
  
  // Member Errors
  Member_MissingName = 'Member_MissingName',
  Member_InvalidEmail = 'Member_InvalidEmail',
  
  // PBKDF2 Errors
  Pbkdf2_InvalidProfile = 'Pbkdf2_InvalidProfile',
  
  // etc - simplified naming
}
```

### 1.3 Update Error Classes

**Current**: Multiple error classes with custom i18n
**Target**: Use i18n 2.0 unified error pattern

```typescript
import { I18nError, I18nErrorCode } from '@digitaldefiance/i18n-lib';

export enum CryptoErrorCode {
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',
  INVALID_KEY_SIZE = 'INVALID_KEY_SIZE',
  INVALID_PROFILE = 'INVALID_PROFILE',
  // etc
}

export class CryptoError extends I18nError {
  constructor(
    code: CryptoErrorCode,
    stringKey: EciesStringKey,
    metadata?: Record<string, unknown>
  ) {
    super(code, getEciesI18nEngine().translate('ecies', stringKey, metadata));
    this.metadata = metadata;
  }
}
```

**Migration**: Consolidate ECIESError, MemberError, Pbkdf2Error, GuidError → CryptoError

## Phase 2: Service Container

### 2.1 Create CryptoContainer

```typescript
// crypto-container.ts
export enum CryptoServiceKey {
  ECIES = 'ecies',
  PBKDF2 = 'pbkdf2',
  AES_GCM = 'aes-gcm',
  PASSWORD_LOGIN = 'password-login',
  FILE = 'file',
}

export class CryptoContainer {
  private services = new Map<CryptoServiceKey, unknown>();
  private config: IConstants;
  private i18n: PluginI18nEngine;

  private constructor(config: IConstants, i18n: PluginI18nEngine) {
    this.config = config;
    this.i18n = i18n;
    this.initServices();
  }

  static create(config = Constants, i18n = getEciesI18nEngine()) {
    return new CryptoContainer(config, i18n);
  }

  get<T>(key: CryptoServiceKey): T {
    return this.services.get(key) as T;
  }

  private initServices() {
    const ecies = new ECIESService(this.config.ECIES);
    const pbkdf2 = new Pbkdf2Service(this.i18n, this.config.PBKDF2_PROFILES);
    
    this.services.set(CryptoServiceKey.ECIES, ecies);
    this.services.set(CryptoServiceKey.PBKDF2, pbkdf2);
    this.services.set(CryptoServiceKey.AES_GCM, new AESGCMService(this.config.ECIES));
    this.services.set(CryptoServiceKey.PASSWORD_LOGIN, 
      new PasswordLoginService(ecies, pbkdf2, this.i18n));
    this.services.set(CryptoServiceKey.FILE, new EciesFileService(ecies));
  }
}
```

**Usage**:
```typescript
const crypto = CryptoContainer.create();
const ecies = crypto.get<ECIESService>(CryptoServiceKey.ECIES);
const pbkdf2 = crypto.get<Pbkdf2Service>(CryptoServiceKey.PBKDF2);
```

## Phase 3: Fluent Builders

### 3.1 ECIESBuilder

```typescript
export class ECIESBuilder {
  private config: Partial<IEciesConsts> = {};
  private i18n?: PluginI18nEngine;

  static create() {
    return new ECIESBuilder();
  }

  withConfig(config: Partial<IEciesConsts>) {
    this.config = { ...this.config, ...config };
    return this;
  }

  withI18n(engine: PluginI18nEngine) {
    this.i18n = engine;
    return this;
  }

  build() {
    return new ECIESService(
      { ...Constants.ECIES, ...this.config },
      this.i18n
    );
  }
}

// Usage
const ecies = ECIESBuilder.create()
  .withConfig({ CURVE_NAME: 'secp256k1' })
  .withI18n(getEciesI18nEngine())
  .build();
```

### 3.2 MemberBuilder

```typescript
export class MemberBuilder {
  private type?: MemberType;
  private name?: string;
  private email?: EmailString;
  private ecies?: ECIESService;
  private mnemonic?: string;

  static create() {
    return new MemberBuilder();
  }

  withType(type: MemberType) {
    this.type = type;
    return this;
  }

  withName(name: string) {
    this.name = name;
    return this;
  }

  withEmail(email: string | EmailString) {
    this.email = typeof email === 'string' ? new EmailString(email) : email;
    return this;
  }

  withECIES(ecies: ECIESService) {
    this.ecies = ecies;
    return this;
  }

  generateMnemonic() {
    this.mnemonic = (this.ecies || new ECIESService()).generateNewMnemonic();
    return this;
  }

  build() {
    if (!this.type || !this.name || !this.email) {
      throw new CryptoError(
        CryptoErrorCode.INVALID_CONFIGURATION,
        EciesStringKey.Member_MissingRequiredFields
      );
    }
    
    return Member.newMember(
      this.ecies || new ECIESService(),
      this.type,
      this.name,
      this.email
    );
  }
}
```

### 3.3 EncryptionPipeline

```typescript
export class EncryptionPipeline {
  private ecies?: ECIESService;
  private mnemonic?: string;
  private keyPair?: { privateKey: Uint8Array; publicKey: Uint8Array };
  private data?: Uint8Array;
  private mode: 'simple' | 'single' = 'single';

  static create() {
    return new EncryptionPipeline();
  }

  withECIES(ecies: ECIESService) {
    this.ecies = ecies;
    return this;
  }

  generateMnemonic() {
    this.mnemonic = (this.ecies || new ECIESService()).generateNewMnemonic();
    return this;
  }

  deriveKeyPair() {
    if (!this.mnemonic) throw new CryptoError(...);
    this.keyPair = (this.ecies || new ECIESService())
      .mnemonicToSimpleKeyPair(this.mnemonic);
    return this;
  }

  withData(data: Uint8Array | string) {
    this.data = typeof data === 'string' 
      ? new TextEncoder().encode(data) 
      : data;
    return this;
  }

  withMode(mode: 'simple' | 'single') {
    this.mode = mode;
    return this;
  }

  async execute() {
    if (!this.keyPair || !this.data) throw new CryptoError(...);
    
    const ecies = this.ecies || new ECIESService();
    return await ecies.encryptSimpleOrSingle(
      this.mode === 'simple',
      this.keyPair.publicKey,
      this.data
    );
  }
}

// Usage
const encrypted = await EncryptionPipeline.create()
  .generateMnemonic()
  .deriveKeyPair()
  .withData('secret message')
  .withMode('single')
  .execute();
```

## Phase 4: Result Pattern

### 4.1 CryptoResult

```typescript
export type CryptoResult<T> = 
  | { success: true; data: T }
  | { success: false; error: CryptoError };

export class ResultBuilder<T> {
  static success<T>(data: T): CryptoResult<T> {
    return { success: true, data };
  }

  static failure<T>(error: CryptoError): CryptoResult<T> {
    return { success: false, error };
  }
}

// Update service methods
class ECIESService {
  async decryptSafe(
    privateKey: Uint8Array,
    ciphertext: Uint8Array
  ): Promise<CryptoResult<Uint8Array>> {
    try {
      const data = await this.decryptSimpleOrSingleWithHeader(
        false,
        privateKey,
        ciphertext
      );
      return ResultBuilder.success(data);
    } catch (error) {
      return ResultBuilder.failure(
        error instanceof CryptoError 
          ? error 
          : new CryptoError(CryptoErrorCode.DECRYPTION_FAILED, ...)
      );
    }
  }
}
```

## Phase 5: Testing Updates

### 5.1 Test Setup

```typescript
// test-setup.ts
import { PluginI18nEngine } from '@digitaldefiance/i18n-lib';

beforeEach(() => {
  PluginI18nEngine.resetAll();
});

afterEach(() => {
  PluginI18nEngine.resetAll();
});
```

### 5.2 Update All Tests

- Replace manual i18n engine creation with `getEciesI18nEngine()`
- Use `PluginI18nEngine.resetAll()` for isolation
- Update error assertions to use `CryptoError` and `CryptoErrorCode`

## Migration Strategy

### Step 1: i18n 2.0 (Week 1)
- Update `i18n-setup.ts` to use i18n 2.0 patterns
- Consolidate error classes to `CryptoError`
- Update all tests for i18n 2.0

### Step 2: Service Container (Week 2)
- Create `CryptoContainer`
- Update examples to use container
- Maintain backward compatibility

### Step 3: Fluent Builders (Week 3)
- Implement builders for common workflows
- Add builder examples to README
- Keep existing constructors

### Step 4: Result Pattern (Week 4)
- Add `*Safe` methods with Result pattern
- Update documentation
- Mark throwing methods as legacy

### Step 5: Documentation (Week 5)
- Update README with 2.0 patterns
- Create MIGRATION_V2.md
- Add examples for all new patterns

## Backward Compatibility

- Keep existing constructors working
- Add deprecation warnings for old patterns
- Provide codemod for automated migration
- Support both patterns for 6 months

## Success Metrics

- 50% reduction in boilerplate code
- 100% test coverage maintained
- Zero breaking changes for existing users
- Migration guide with examples
- All 389+ tests passing

## Timeline

- **Week 1-2**: i18n 2.0 migration + error consolidation
- **Week 3-4**: Service container + builders
- **Week 5-6**: Result pattern + documentation
- **Week 7**: Testing + migration guide
- **Week 8**: Release 2.0.0-beta.1

## Next Steps

1. Review and approve this plan
2. Create feature branch `feature/v2-architecture`
3. Start with Phase 1 (i18n 2.0 migration)
4. Implement incrementally with tests
5. Release beta for community feedback
