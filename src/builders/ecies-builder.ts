/**
 * Fluent builder for ECIESService.
 */

import { PluginI18nEngine } from '@digitaldefiance/i18n-lib';
import { Constants } from '../constants';
import { IECIESConfig } from '../interfaces/ecies-config';
import { IECIESConstants } from '../interfaces/ecies-consts';
import { ECIESService } from '../services/ecies/service';

export class ECIESBuilder {
  private serviceConfig: Partial<IECIESConfig> = {};
  private eciesConsts: Partial<IECIESConstants> = {};
  private _i18n?: PluginI18nEngine<string>;

  /**
   * Creates a new ECIESBuilder instance.
   * @returns A new builder instance
   */
  static create(): ECIESBuilder {
    return new ECIESBuilder();
  }

  /**
   * Sets the service configuration.
   * @param config Partial service configuration
   * @returns This builder for chaining
   */
  withServiceConfig(config: Partial<IECIESConfig>): this {
    this.serviceConfig = { ...this.serviceConfig, ...config };
    return this;
  }

  /**
   * Sets the ECIES constants.
   * @param constants Partial ECIES constants
   * @returns This builder for chaining
   */
  withConstants(constants: Partial<IECIESConstants>): this {
    this.eciesConsts = { ...this.eciesConsts, ...constants };
    return this;
  }

  /**
   * Sets the i18n engine.
   * @param engine The i18n engine instance
   * @returns This builder for chaining
   */
  withI18n(engine: PluginI18nEngine<string>): this {
    this._i18n = engine;
    return this;
  }

  /**
   * Builds and returns the configured ECIESService instance.
   * @returns A new ECIESService instance
   */
  build(): ECIESService {
    const finalConstants = { ...Constants.ECIES, ...this.eciesConsts };
    return new ECIESService(this.serviceConfig, finalConstants);
  }
}
