/**
 * Fluent builder for ECIESService
 */

import { PluginI18nEngine } from '@digitaldefiance/i18n-lib';
import { IECIESConstants } from '../interfaces/ecies-consts';
import { Constants } from '../constants';
import { getEciesI18nEngine } from '../i18n-setup';

export class ECIESBuilder {
  private config: Partial<IECIESConstants> = {};
  private i18n?: PluginI18nEngine<string>;

  static create(): ECIESBuilder {
    return new ECIESBuilder();
  }

  withConfig(config: Partial<IECIESConstants>): this {
    this.config = { ...this.config, ...config };
    return this;
  }

  withI18n(engine: PluginI18nEngine<string>): this {
    this.i18n = engine;
    return this;
  }

  build(): any {
    // Will return ECIESService once migrated
    const finalConfig = { ...Constants.ECIES, ...this.config };
    const finalI18n = this.i18n || getEciesI18nEngine();
    
    // Placeholder - will import and instantiate ECIESService
    throw new Error('ECIESService not yet migrated to v2');
  }
}
