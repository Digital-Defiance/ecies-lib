/**
 * Service Container for dependency injection
 */

import { I18nEngine } from '@digitaldefiance/i18n-lib';
import { EciesStringKey } from '../enumerations/ecies-string-key';
import { EciesComponentId, getEciesI18nEngine } from '../i18n-setup';
import type { IConstants } from '../interfaces/constants';

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
  private i18n: I18nEngine;

  private constructor(config: IConstants, i18n: I18nEngine) {
    this.config = config;
    this.i18n = i18n;
    this.initServices();
  }

  static create(
    config?: IConstants,
    i18n?: I18nEngine,
  ): CryptoContainer {
    const finalConfig: IConstants = config ?? (() => {
      // Lazy import to avoid circular dependency
      const { Constants } = require('../constants');
      return Constants as IConstants;
    })();
    return new CryptoContainer(finalConfig, i18n || getEciesI18nEngine());
  }

  get<T>(key: CryptoServiceKey): T {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(
        this.i18n.translate(
          EciesComponentId,
          EciesStringKey.Error_Container_ServiceNotFoundTemplate,
          { service: key },
        ),
      );
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

  getI18n(): I18nEngine {
    return this.i18n;
  }
}
