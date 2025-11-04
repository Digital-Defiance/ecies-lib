import { PluginI18nEngine, CoreStringKey } from '@digitaldefiance/i18n-lib';

export class DisposedError extends Error {
  constructor() {
    const engine = PluginI18nEngine.getInstance<string>('default');
    const message = engine.translate('core', CoreStringKey.Common_Disposed);
    super(message);
    this.name = 'DisposedError';
  }
}
