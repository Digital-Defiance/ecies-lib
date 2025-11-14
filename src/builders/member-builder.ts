/**
 * Fluent builder for Member
 */

import { MemberType } from '../enumerations/member-type';
import { EmailString } from '../email-string';
import { Member } from '../member';
import { IMemberWithMnemonic } from '../interfaces/member-with-mnemonic';
import { ECIESService } from '../services/ecies/service';
import { SecureString } from '../secure-string';
import { ObjectId } from 'bson';
import { EciesComponentId, getEciesI18nEngine } from '../i18n-setup';
import { EciesStringKey } from '../enumerations';

export class MemberBuilder {
  private eciesService?: ECIESService;
  private type?: MemberType;
  private name?: string;
  private email?: EmailString;
  private mnemonic?: SecureString;
  private createdBy?: ObjectId;

  static create(): MemberBuilder {
    return new MemberBuilder();
  }

  withEciesService(service: ECIESService): this {
    this.eciesService = service;
    return this;
  }

  withType(type: MemberType): this {
    this.type = type;
    return this;
  }

  withName(name: string): this {
    this.name = name;
    return this;
  }

  withEmail(email: string | EmailString): this {
    this.email = typeof email === 'string' ? new EmailString(email) : email;
    return this;
  }

  withMnemonic(mnemonic: SecureString): this {
    this.mnemonic = mnemonic;
    return this;
  }

  withCreatedBy(creatorId: ObjectId): this {
    this.createdBy = creatorId;
    return this;
  }

  generateMnemonic(): this {
    if (!this.eciesService) {
      const engine = getEciesI18nEngine();
      throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_Builder_ECIESServiceMustBeSetBeforeGeneratingMnemonic));
    }
    this.mnemonic = this.eciesService.generateNewMnemonic();
    return this;
  }

  build(): IMemberWithMnemonic {
    const engine = getEciesI18nEngine();
    if (!this.eciesService) {
      throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_Builder_ECIESServiceIsRequired));
    }
    if (!this.type || !this.name || !this.email) {
      throw new Error(engine.translate(EciesComponentId, EciesStringKey.Error_Builder_TypeNameAndEmailAreRequired));
    }
    
    return Member.newMember(
      this.eciesService,
      this.type,
      this.name,
      this.email,
      this.mnemonic,
      this.createdBy
    );
  }
}
