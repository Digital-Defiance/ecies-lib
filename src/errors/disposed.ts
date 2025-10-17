import { CoreStringKey, I18nEngine, Language } from '@digitaldefiance/i18n-lib';

export class DisposedError extends Error {
  constructor() {
    const engine = I18nEngine.getInstance();
    super(engine.translate(CoreStringKey.Common_Disposed));
    this.name = 'DisposedError';
  }
}
