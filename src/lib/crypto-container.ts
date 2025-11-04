/**
 * Service Container for dependency injection
 */

import { PluginI18nEngine } from '@digitaldefiance/i18n-lib';
import { IConstants } from '../interfaces';
import { Constants } from '../constants';
import { getEciesI18nEngine } from '../i18n-setup';

export enum CryptoServiceKey {
  ECIES = 'ecies',
  PBKDF2 = 'pbkdf2',
  AES_GCM = 'aes-gcm',
  PASSWORD_LOGIN = 'password-login',
  FILE = 'file',
  XOR = 'xor',
}

export class CryptoContainer {
  private services = new Map<CryptoServiceKey, unknown>();
  private config: IConstants;
  private i18n: PluginI18nEngine<string>;

  private constructor(config: IConstants, i18n: PluginI18nEngine<string>) {
    this.config = config;
    this.i18n = i18n;
    this.initServices();
  }

  static create(config: IConstants = Constants, i18n?: PluginI18nEngine<string>): CryptoContainer {
    return new CryptoContainer(config, i18n || getEciesI18nEngine());
  }

  get<T>(key: CryptoServiceKey): T {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`Service ${key} not found in container`);
    }
    return service as T;
  }

  private initServices(): void {
    // Services will be lazily loaded to avoid circular dependencies
    // Implementation will be added as services are migrated
  }

  getConfig(): IConstants {
    return this.config;
  }

  getI18n(): PluginI18nEngine<string> {
    return this.i18n;
  }
}
