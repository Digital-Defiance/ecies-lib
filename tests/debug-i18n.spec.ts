import { I18nEngine } from '@digitaldefiance/i18n-lib';
import { getEciesI18nEngine, EciesComponentId } from '../src/i18n-setup';
import { EciesStringKey } from '../src/enumerations/ecies-string-key';

describe('I18n Debug', () => {
  it('should have engine registered', () => {
    const engine = getEciesI18nEngine();
    expect(engine).toBeDefined();
    console.log('Engine exists:', !!engine);
  });

  it('should have default instance', () => {
    getEciesI18nEngine();
    const hasInstance = I18nEngine.hasInstance('default');
    console.log('Has instance "default":', hasInstance);
    expect(hasInstance).toBe(true);
  });

  it('should have ecies component registered', () => {
    const engine = getEciesI18nEngine();
    const hasComponent = engine.hasComponent(EciesComponentId);
    console.log('Has component "ecies":', hasComponent);
    expect(hasComponent).toBe(true);
  });

  it('should have translations in component', () => {
    const engine = getEciesI18nEngine();
    const components = engine.getComponents();
    const eciesComponent = components.find(c => c.id === EciesComponentId);
    console.log('ECIES component:', eciesComponent);
    console.log('Has strings:', !!eciesComponent?.strings);
    console.log('Languages:', Object.keys(eciesComponent?.strings || {}));
    console.log('en-US keys count:', Object.keys(eciesComponent?.strings?.['en-US'] || {}).length);
    console.log('Sample key:', eciesComponent?.strings?.['en-US']?.[EciesStringKey.Error_ECIESError_DecryptionFailed]);
  });

  it('should translate a key', () => {
    const engine = getEciesI18nEngine();
    try {
      const result = engine.translate(
        EciesComponentId,
        EciesStringKey.Error_ECIESError_DecryptionFailed
      );
      console.log('Translation result:', result);
      expect(result).toBe('Decryption operation failed');
    } catch (e: any) {
      console.error('Translation error:', e.message);
      throw e;
    }
  });
});
