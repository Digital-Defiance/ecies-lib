import { I18nEngine, CoreStringKey } from '@digitaldefiance/i18n-lib';
import { getEciesI18nEngine } from '../i18n-setup';

export class DisposedError extends Error {
  constructor() {
    let message = 'Object has been disposed';
    try {
      const engine = getEciesI18nEngine();
      message = engine.translate('core', CoreStringKey.Common_Disposed);
    } catch {
      // Fallback to default message if engine not available
    }
    super(message);
    this.name = 'DisposedError';
  }
}
