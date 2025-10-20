import { CoreStringKey, I18nEngine, Language } from '@digitaldefiance/i18n-lib';

export class DisposedError extends Error {
  constructor() {
    let message = 'Object has been disposed';
    try {
      const engine = I18nEngine.getInstance();
      message = engine.translate(CoreStringKey.Common_Disposed);
    } catch {
      // I18n engine not initialized, use fallback message
    }
    super(message);
    this.name = 'DisposedError';
  }
}
