/**
 * ECIES i18n Setup - v2.0 Architecture
 * Uses i18n-lib 2.0 patterns with runtime validation
 */

import type { ComponentConfig, EngineConfig } from '@digitaldefiance/i18n-lib';
import {
  I18nEngine,
  LanguageCodes,
  createCoreComponentRegistration,
  createDefaultLanguages,
} from '@digitaldefiance/i18n-lib';
import { EciesStringKey } from './enumerations/ecies-string-key';
import { germanTranslations } from './translations/de';
import { englishTranslations } from './translations/en-US';
import { spanishTranslations } from './translations/es';
import { frenchTranslations } from './translations/fr';
import { japaneseTranslations } from './translations/ja';
import { ukrainianTranslations } from './translations/uk';
import { mandarinChineseTranslations } from './translations/zh-cn';

export const EciesI18nEngineKey = 'DigitalDefiance.Ecies.I18nEngine' as const;
export const EciesComponentId = 'ecies' as const;

/**
 * Create ECIES component configuration with all translations
 * Note: Includes all 8 supported languages
 */
export function createEciesComponentConfig(): ComponentConfig {
  return {
    id: EciesComponentId,
    strings: {
      [LanguageCodes.EN_US]: englishTranslations,
      [LanguageCodes.EN_GB]: englishTranslations,
      [LanguageCodes.FR]: frenchTranslations,
      [LanguageCodes.ES]: spanishTranslations,
      [LanguageCodes.DE]: germanTranslations,
      [LanguageCodes.ZH_CN]: mandarinChineseTranslations,
      [LanguageCodes.JA]: japaneseTranslations,
      [LanguageCodes.UK]: ukrainianTranslations,
    },
  };
}

/**
 * Create ECIES i18n engine instance
 * Uses i18n 2.0 pattern with runtime validation
 * IMPORTANT: Uses 'default' as instance key so TypedHandleableError can find it
 */
function createInstance(config?: EngineConfig): I18nEngine {
  const engine = I18nEngine.registerIfNotExists(
    'default',
    createDefaultLanguages(),
    config,
  );

  // Register core component first (required for error messages)
  const coreReg = createCoreComponentRegistration();
  engine.registerIfNotExists({
    id: coreReg.component.id,
    strings: coreReg.strings as Record<string, Record<string, string>>,
  });

  // Register ECIES component with aliases
  const eciesConfig = createEciesComponentConfig();
  const result = engine.registerIfNotExists({
    ...eciesConfig,
    aliases: ['EciesStringKey'],
  });

  // Warn about missing translations (non-blocking)
  if (!result.isValid && result.errors.length > 0) {
    console.warn(
      `ECIES component has ${result.errors.length} errors`,
      result.errors.slice(0, 5), // Show first 5
    );
  }

  return engine;
}

/**
 * Lazy initialization with Proxy (like core-i18n.ts pattern)
 */
let _eciesEngine: I18nEngine | undefined;

export function getEciesI18nEngine(config?: EngineConfig): I18nEngine {
  if (!_eciesEngine || !I18nEngine.hasInstance('default')) {
    _eciesEngine = createInstance(config);
  }
  return _eciesEngine;
}

/**
 * Proxy for backward compatibility
 */
export const eciesI18nEngine = new Proxy({} as I18nEngine, {
  get(__target, prop) {
    return getEciesI18nEngine()[prop as keyof I18nEngine];
  },
});

/**
 * Reset function for tests
 */
export function resetEciesI18nEngine(): void {
  _eciesEngine = undefined;
}

/**
 * Helper to translate ECIES strings
 */
export function getEciesTranslation(
  stringKey: EciesStringKey,
  variables?: Record<string, string | number>,
  language?: string,
): string {
  return getEciesI18nEngine().translate(
    EciesComponentId,
    stringKey,
    variables,
    language,
  );
}

/**
 * Safe translation with fallback
 */
export function safeEciesTranslation(
  stringKey: EciesStringKey,
  variables?: Record<string, string | number>,
  language?: string,
): string {
  try {
    return getEciesTranslation(stringKey, variables, language);
  } catch {
    return `[${stringKey}]`;
  }
}
