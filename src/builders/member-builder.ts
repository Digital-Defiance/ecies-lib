/**
 * Fluent builder for Member
 */

import { MemberType } from '../enumerations/member-type';
import { EmailString } from '../email-string';
import { CryptoError, CryptoErrorCode } from '../core/errors/crypto-error';
import { EciesStringKey } from '../enumerations/ecies-string-key';

export class MemberBuilder {
  private type?: MemberType;
  private name?: string;
  private email?: EmailString;
  private mnemonic?: string;

  static create(): MemberBuilder {
    return new MemberBuilder();
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

  generateMnemonic(): this {
    // Will use ECIESService once migrated
    throw new Error('Mnemonic generation not yet implemented in v2');
  }

  build(): any {
    if (!this.type || !this.name || !this.email) {
      throw new CryptoError(
        CryptoErrorCode.MISSING_MEMBER_NAME,
        EciesStringKey.Error_MemberError_MissingMemberName
      );
    }
    
    // Placeholder - will create Member once migrated
    throw new Error('Member not yet migrated to v2');
  }
}
