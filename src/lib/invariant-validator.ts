import { TranslatableGenericError } from '@digitaldefiance/i18n-lib';
import {
  EciesStringKey,
  EciesStringKeyValue,
  EciesComponentId,
} from '../enumerations/ecies-string-key';
import { getEciesI18nEngine } from '../i18n-setup';
import { IConstants } from '../interfaces/constants';
import { IInvariant } from '../interfaces/invariant';
import {
  EncryptionAlgorithmConsistencyInvariant,
  Pbkdf2ProfilesValidityInvariant,
  RecipientIdConsistencyInvariant,
} from './invariants';

/**
 * Validates all configuration invariants.
 *
 * This class maintains a registry of all invariants and validates them
 * whenever a configuration is created or modified.
 *
 * Adding new invariants is easy - just:
 * 1. Create a class implementing IInvariant
 * 2. Add it to the DEFAULT_INVARIANTS array
 * 3. Tests will automatically validate it
 */
export class InvariantValidator {
  /**
   * Default invariants that are always checked
   */
  private static readonly DEFAULT_INVARIANTS: IInvariant[] = [
    new RecipientIdConsistencyInvariant(),
    new Pbkdf2ProfilesValidityInvariant(),
    new EncryptionAlgorithmConsistencyInvariant(),
  ];

  /**
   * Custom invariants registered at runtime
   */
  private static customInvariants: IInvariant[] = [];

  /**
   * Register a custom invariant to be checked alongside default invariants
   */
  static registerInvariant(invariant: IInvariant): void {
    this.customInvariants.push(invariant);
  }

  /**
   * Clear all custom invariants (useful for testing)
   */
  static clearCustomInvariants(): void {
    this.customInvariants = [];
  }

  /**
   * Get all invariants (default + custom)
   */
  static getAllInvariants(): readonly IInvariant[] {
    return [...this.DEFAULT_INVARIANTS, ...this.customInvariants];
  }

  /**
   * Validate all invariants for a given configuration
   *
   * @param config The configuration to validate
   * @throws Error if any invariant fails
   */
  static validateAll(config: IConstants): void {
    const allInvariants = this.getAllInvariants();
    const failures: string[] = [];

    for (const invariant of allInvariants) {
      if (!invariant.check(config)) {
        failures.push(invariant.errorMessage(config));
      }
    }

    if (failures.length > 0) {
      const engine = getEciesI18nEngine();
      throw TranslatableGenericError.withEngine<EciesStringKeyValue>(
        engine,
        EciesComponentId,
        EciesStringKey.Error_Invariant_ConfigurationValidationFailedMultipleTemplate,
        { count: failures.length, failures: failures.join('\n\n') },
        undefined,
        { invariantCount: failures.length },
      );
    }
  }

  /**
   * Check a single invariant
   *
   * @param config The configuration to validate
   * @param invariantName Name of the invariant to check
   * @returns true if invariant passes, false otherwise
   */
  static checkInvariant(config: IConstants, invariantName: string): boolean {
    const invariant = this.getAllInvariants().find(
      (i) => i.name === invariantName,
    );
    if (!invariant) {
      const engine = getEciesI18nEngine();
      throw TranslatableGenericError.withEngine<EciesStringKeyValue>(
        engine,
        EciesComponentId,
        EciesStringKey.Error_Invariant_UnknownInvariantTemplate,
        { name: invariantName },
        undefined,
        { invariantName },
      );
    }
    return invariant.check(config);
  }

  /**
   * Get failure details for a specific invariant
   *
   * @param config The configuration to validate
   * @param invariantName Name of the invariant to check
   * @returns Error message if invariant fails, null if it passes
   */
  static getFailureDetails(
    config: IConstants,
    invariantName: string,
  ): string | null {
    const invariant = this.getAllInvariants().find(
      (i) => i.name === invariantName,
    );
    if (!invariant) {
      const engine = getEciesI18nEngine();
      throw TranslatableGenericError.withEngine<EciesStringKeyValue>(
        engine,
        EciesComponentId,
        EciesStringKey.Error_Invariant_UnknownInvariantTemplate,
        { name: invariantName },
        undefined,
        { invariantName },
      );
    }
    return invariant.check(config) ? null : invariant.errorMessage(config);
  }
}
