/**
 * Fluent builder for ECIESService
 */

import { PluginI18nEngine } from '@digitaldefiance/i18n-lib';
import { IECIESConstants } from '../interfaces/ecies-consts';
import { IECIESConfig } from '../interfaces/ecies-config';
import { Constants } from '../constants';
import { ECIESService } from '../services/ecies/service';

export class ECIESBuilder {
  private serviceConfig: Partial<IECIESConfig> = {};
  private eciesConsts: Partial<IECIESConstants> = {};
  private i18n?: PluginI18nEngine<string>;

  static create(): ECIESBuilder {
    return new ECIESBuilder();
  }

  withServiceConfig(config: Partial<IECIESConfig>): this {
    this.serviceConfig = { ...this.serviceConfig, ...config };
    return this;
  }

  withConstants(constants: Partial<IECIESConstants>): this {
    this.eciesConsts = { ...this.eciesConsts, ...constants };
    return this;
  }

  withI18n(engine: PluginI18nEngine<string>): this {
    this.i18n = engine;
    return this;
  }

  build(): ECIESService {
    const finalConstants = { ...Constants.ECIES, ...this.eciesConsts };
    return new ECIESService(this.serviceConfig, finalConstants);
  }
}
