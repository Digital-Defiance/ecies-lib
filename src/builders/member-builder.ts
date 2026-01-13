/**
 * Fluent builder for Member instances.
 * Provides a convenient way to configure and create Member instances with all required properties.
 *
 * @example
 * ```typescript
 * const { member, mnemonic } = MemberBuilder.create()
 *   .withEciesService(service)
 *   .withType(MemberType.User)
 *   .withName('Alice')
 *   .withEmail('alice@example.com')
 *   .generateMnemonic()
 *   .build();
 * ```
 */

import { EmailString } from '../email-string';
import { EciesStringKey } from '../enumerations';
import { MemberType } from '../enumerations/member-type';
import { EciesComponentId, getEciesI18nEngine } from '../i18n-setup';
import { PlatformID } from '../interfaces';
import { IMemberWithMnemonic, Member } from '../member';
import { SecureString } from '../secure-string';
import { ECIESService } from '../services/ecies/service';

export class MemberBuilder {
  private eciesService?: ECIESService;
  private type?: MemberType;
  private name?: string;
  private email?: EmailString;
  private mnemonic?: SecureString;
  private createdBy?: Uint8Array; // ID of the creator

  /**
   * Creates a new MemberBuilder instance.
   * @returns A new builder instance
   */
  static create(): MemberBuilder {
    return new MemberBuilder();
  }

  /**
   * Sets the ECIES service to use.
   * @param service The ECIES service instance
   * @returns This builder for chaining
   */
  withEciesService(service: ECIESService): this {
    this.eciesService = service;
    return this;
  }

  /**
   * Sets the member type.
   * @param type The member type (Admin, System, User, Anonymous)
   * @returns This builder for chaining
   */
  withType(type: MemberType): this {
    this.type = type;
    return this;
  }

  /**
   * Sets the member name.
   * @param name The member's display name
   * @returns This builder for chaining
   */
  withName(name: string): this {
    this.name = name;
    return this;
  }

  /**
   * Sets the member email.
   * @param email The member's email address (string or EmailString)
   * @returns This builder for chaining
   */
  withEmail(email: string | EmailString): this {
    this.email = typeof email === 'string' ? new EmailString(email) : email;
    return this;
  }

  /**
   * Sets a specific mnemonic to use.
   * @param mnemonic The BIP39 mnemonic phrase
   * @returns This builder for chaining
   */
  withMnemonic(mnemonic: SecureString): this {
    this.mnemonic = mnemonic;
    return this;
  }

  /**
   * Sets the creator ID.
   * @param creatorId The ID of the member who created this member
   * @returns This builder for chaining
   */
  withCreatedBy(creatorId: Uint8Array): this {
    this.createdBy = creatorId;
    return this;
  }

  /**
   * Generates a new random mnemonic.
   * @returns This builder for chaining
   * @throws {Error} If ECIES service is not set
   */
  generateMnemonic(): this {
    if (!this.eciesService) {
      const engine = getEciesI18nEngine();
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_Builder_ECIESServiceMustBeSetBeforeGeneratingMnemonic,
        ),
      );
    }
    this.mnemonic = this.eciesService.generateNewMnemonic();
    return this;
  }

  /**
   * Builds and returns the configured Member instance with its mnemonic.
   * @returns Object containing the member and mnemonic
   * @throws {Error} If required fields are missing
   */
  build(): IMemberWithMnemonic {
    const engine = getEciesI18nEngine();
    if (!this.eciesService) {
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_Builder_ECIESServiceIsRequired,
        ),
      );
    }
    if (!this.type || !this.name || !this.email) {
      throw new Error(
        engine.translate(
          EciesComponentId,
          EciesStringKey.Error_Builder_TypeNameAndEmailAreRequired,
        ),
      );
    }

    return Member.newMember(
      this.eciesService,
      this.type,
      this.name,
      this.email,
      this.mnemonic,
      this.createdBy,
    );
  }

  /**
   * Convenience factory method to create a new member with default ECIESService
   * @param type - The member type
   * @param name - The member name
   * @param email - The member email
   * @param forceMnemonic - Optional mnemonic to use instead of generating a new one
   * @param createdBy - Optional creator ID
   * @returns Member with mnemonic
   */
  static newMember(
    type: MemberType,
    name: string,
    email: EmailString | string,
    forceMnemonic?: SecureString,
    createdBy?: Uint8Array,
  ): IMemberWithMnemonic {
    const service = new ECIESService();
    const emailObj = typeof email === 'string' ? new EmailString(email) : email;

    return Member.newMember(
      service,
      type,
      name,
      emailObj,
      forceMnemonic,
      createdBy,
    );
  }

  /**
   * Convenience factory method to create a member from JSON with default ECIESService
   * @param json - JSON string representation of member
   * @returns Member instance
   */
  static fromJson<TID extends PlatformID = Uint8Array>(
    json: string,
  ): Member<TID> {
    const service = new ECIESService();
    return Member.fromJson(json, service) as Member<TID>;
  }

  /**
   * Convenience factory method to create a member from mnemonic with default ECIESService
   * @param mnemonic - The mnemonic to use
   * @param name - Optional member name (defaults to 'Test User')
   * @param email - Optional member email (defaults to 'test@example.com')
   * @returns Member instance
   */
  static fromMnemonic<TID extends PlatformID = Uint8Array>(
    mnemonic: SecureString,
    name = 'Test User',
    email: EmailString | string = 'test@example.com',
  ): Member<TID> {
    const service = new ECIESService();
    const emailObj = typeof email === 'string' ? new EmailString(email) : email;

    return Member.fromMnemonic(
      mnemonic,
      service,
      undefined,
      name,
      emailObj,
    ) as Member<TID>;
  }
}
