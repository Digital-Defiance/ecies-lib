/**
 * @fileoverview Tests for the TDate generic parameter across Member and ECIESError.
 *
 * TDate extends Date | number, allowing callers to use any scalar date representation.
 * The library stores and round-trips the value without interpreting it — conversion
 * is entirely the caller's responsibility via dateFactory / dateSerializer / dateDeserializer.
 *
 * The number-based tests use a J2000.0 epoch stub (decimal days since 2000-01-01T12:00:00Z)
 * as a representative example of a non-Unix number date type. The same pattern applies to
 * any external date library that stores time as a number with a custom epoch or unit.
 */

import { EmailString } from './email-string';
import { ECIESErrorTypeEnum } from './enumerations/ecies-error-type';
import { MemberType } from './enumerations/member-type';
import { ECIESError } from './errors/ecies';
import { Member } from './member';
import { SecureBuffer } from './secure-buffer';
import { ECIESService } from './services/ecies/service';

// ---------------------------------------------------------------------------
// Example number-date stub: decimal days since J2000.0 epoch
// (representative of any non-Unix number date type, e.g. BrightDate)
// J2000.0 = 2000-01-01T12:00:00Z  (Unix ms: 946728000000)
// ---------------------------------------------------------------------------
const J2000_UNIX_MS = 946728000000;
const MS_PER_DAY = 86_400_000;

/** Convert a JS Date to a J2000-epoch decimal-day number. */
function toDecimalDay(date: Date): number {
  return (date.getTime() - J2000_UNIX_MS) / MS_PER_DAY;
}

/** Convert a J2000-epoch decimal-day number back to a JS Date. */
function fromDecimalDay(d: number): Date {
  return new Date(d * MS_PER_DAY + J2000_UNIX_MS);
}

/** Serialize a decimal-day number to ISO string for storage. */
function decimalDaySerializer(d: number): string {
  return fromDecimalDay(d).toISOString();
}

/** Deserialize an ISO string back to a decimal-day number. */
function decimalDayDeserializer(iso: string): number {
  return toDecimalDay(new Date(iso));
}

/** Factory: current time as a decimal-day number. */
function decimalDayFactory(): number {
  return toDecimalDay(new Date());
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeService() {
  return new ECIESService();
}

function makeMember(eciesService = makeService()) {
  return Member.newMember(
    eciesService,
    MemberType.User,
    'Test User',
    new EmailString('test@example.com'),
  );
}

// ---------------------------------------------------------------------------
// Member — default TDate = Date behaviour
// ---------------------------------------------------------------------------

describe('Member TDate = Date (default)', () => {
  it('dateCreated and dateUpdated are Date instances', () => {
    const { member } = makeMember();
    expect(member.dateCreated).toBeInstanceOf(Date);
    expect(member.dateUpdated).toBeInstanceOf(Date);
  });

  it('dateCreated and dateUpdated share the same memoised value when both omitted', () => {
    const eciesService = makeService();
    const { wallet } = eciesService.walletAndSeedFromMnemonic(
      eciesService.generateNewMnemonic(),
    );
    const privateKey = wallet.getPrivateKey();
    const publicKey = eciesService.getPublicKey(privateKey);

    const member = new Member(
      eciesService,
      MemberType.User,
      'Same Date',
      new EmailString('same@example.com'),
      publicKey,
      new SecureBuffer(privateKey),
      wallet,
      // id, dateCreated, dateUpdated, creatorId all omitted → both use cachedNow()
    );

    expect(member.dateCreated.getTime()).toBe(member.dateUpdated.getTime());
  });

  it('toJson serialises dates as ISO strings', () => {
    const { member } = makeMember();
    const parsed = JSON.parse(member.toJson());
    expect(() => new Date(parsed.dateCreated)).not.toThrow();
    expect(new Date(parsed.dateCreated).toISOString()).toBe(parsed.dateCreated);
    expect(new Date(parsed.dateUpdated).toISOString()).toBe(parsed.dateUpdated);
  });

  it('fromJson round-trips dates correctly', () => {
    const { member } = makeMember();
    const json = member.toJson();
    const restored = Member.fromJson(json);

    expect(restored.dateCreated.toISOString()).toBe(
      member.dateCreated.toISOString(),
    );
    expect(restored.dateUpdated.toISOString()).toBe(
      member.dateUpdated.toISOString(),
    );
  });

  it('newMember dateCreated and dateUpdated are the same value', () => {
    const { member } = makeMember();
    expect(member.dateCreated.getTime()).toBe(member.dateUpdated.getTime());
  });
});

// ---------------------------------------------------------------------------
// Member — TDate = number (non-Unix epoch, e.g. decimal days since J2000.0)
// ---------------------------------------------------------------------------

describe('Member TDate = number (custom epoch)', () => {
  function makeNumberMember(
    dateCreated?: number,
    dateUpdated?: number,
  ): Member<Uint8Array, number> {
    const eciesService = makeService();
    const { wallet } = eciesService.walletAndSeedFromMnemonic(
      eciesService.generateNewMnemonic(),
    );
    const privateKey = wallet.getPrivateKey();
    const publicKey = eciesService.getPublicKey(privateKey);

    return new Member<Uint8Array, number>(
      eciesService,
      MemberType.User,
      'Number Date User',
      new EmailString('numdate@example.com'),
      publicKey,
      new SecureBuffer(privateKey),
      wallet,
      undefined, // id
      dateCreated, // TDate
      dateUpdated, // TDate
      undefined, // creatorId
      decimalDayFactory,
      decimalDaySerializer,
      decimalDayDeserializer,
    );
  }

  it('dateCreated and dateUpdated are numbers', () => {
    const member = makeNumberMember();
    expect(typeof member.dateCreated).toBe('number');
    expect(typeof member.dateUpdated).toBe('number');
  });

  it('dateFactory is called when dates are omitted', () => {
    const before = decimalDayFactory();
    const member = makeNumberMember();
    const after = decimalDayFactory();

    expect(member.dateCreated).toBeGreaterThanOrEqual(before);
    expect(member.dateCreated).toBeLessThanOrEqual(after);
  });

  it('both dates share the same memoised value when omitted', () => {
    const member = makeNumberMember();
    expect(member.dateCreated).toBe(member.dateUpdated);
  });

  it('explicit dates are stored as-is', () => {
    const created = toDecimalDay(new Date('2025-01-01T00:00:00Z'));
    const updated = toDecimalDay(new Date('2025-06-01T00:00:00Z'));
    const member = makeNumberMember(created, updated);

    expect(member.dateCreated).toBeCloseTo(created, 10);
    expect(member.dateUpdated).toBeCloseTo(updated, 10);
  });

  it('toJson uses dateSerializer to produce ISO strings', () => {
    const created = toDecimalDay(new Date('2025-03-15T06:00:00Z'));
    const updated = toDecimalDay(new Date('2025-03-16T12:00:00Z'));
    const member = makeNumberMember(created, updated);

    const parsed = JSON.parse(member.toJson());

    expect(() => new Date(parsed.dateCreated)).not.toThrow();
    expect(new Date(parsed.dateCreated).toISOString()).toBe(parsed.dateCreated);

    // Round-trip via deserializer confirms the serializer used the right epoch
    expect(decimalDayDeserializer(parsed.dateCreated)).toBeCloseTo(created, 6);
    expect(decimalDayDeserializer(parsed.dateUpdated)).toBeCloseTo(updated, 6);
  });

  it('fromJson uses dateDeserializer to restore number dates', () => {
    const created = toDecimalDay(new Date('2024-07-04T00:00:00Z'));
    const updated = toDecimalDay(new Date('2024-07-05T00:00:00Z'));
    const member = makeNumberMember(created, updated);

    const json = member.toJson();
    const restored = Member.fromJson<Uint8Array, number>(
      json,
      undefined,
      decimalDayDeserializer,
      decimalDaySerializer,
      decimalDayFactory,
    );

    expect(typeof restored.dateCreated).toBe('number');
    expect(restored.dateCreated).toBeCloseTo(created, 6);
    expect(restored.dateUpdated).toBeCloseTo(updated, 6);
  });

  it('fromJson without deserializer falls back to Date (default behaviour)', () => {
    const created = toDecimalDay(new Date('2024-01-01T00:00:00Z'));
    const member = makeNumberMember(created);

    const json = member.toJson();
    const restored = Member.fromJson(json);

    expect(restored.dateCreated).toBeInstanceOf(Date);
  });

  it('newMember with dateFactory produces number dates', () => {
    const eciesService = makeService();
    const before = decimalDayFactory();
    const { member } = Member.newMember<Uint8Array, number>(
      eciesService,
      MemberType.User,
      'Number New',
      new EmailString('numnew@example.com'),
      undefined,
      undefined,
      undefined,
      decimalDayFactory,
      decimalDaySerializer,
      decimalDayDeserializer,
    );
    const after = decimalDayFactory();

    expect(typeof member.dateCreated).toBe('number');
    expect(member.dateCreated).toBeGreaterThanOrEqual(before);
    expect(member.dateCreated).toBeLessThanOrEqual(after);
    expect(member.dateCreated).toBe(member.dateUpdated);
  });

  it('full round-trip: newMember → toJson → fromJson preserves number date', () => {
    const eciesService = makeService();
    const { member } = Member.newMember<Uint8Array, number>(
      eciesService,
      MemberType.User,
      'Round Trip',
      new EmailString('roundtrip@example.com'),
      undefined,
      undefined,
      undefined,
      decimalDayFactory,
      decimalDaySerializer,
      decimalDayDeserializer,
    );

    const json = member.toJson();
    const restored = Member.fromJson<Uint8Array, number>(
      json,
      undefined,
      decimalDayDeserializer,
      decimalDaySerializer,
      decimalDayFactory,
    );

    expect(typeof restored.dateCreated).toBe('number');
    expect(restored.dateCreated).toBeCloseTo(member.dateCreated, 6);
    expect(restored.dateUpdated).toBeCloseTo(member.dateUpdated, 6);
  });
});

// ---------------------------------------------------------------------------
// ECIESError — default TDate = Date behaviour
// ---------------------------------------------------------------------------

describe('ECIESError IErrorContext TDate = Date (default)', () => {
  it('timestamp defaults to a Date when omitted', () => {
    const err = new ECIESError(
      ECIESErrorTypeEnum.EncryptionFailed,
      undefined,
      undefined,
      undefined,
      {
        operation: 'test',
        stackTrace: 'n/a',
      },
    );

    expect(err.context?.timestamp).toBeInstanceOf(Date);
  });

  it('getDetailedReport includes a valid ISO timestamp', () => {
    const ts = new Date('2025-01-15T10:00:00Z');
    const err = new ECIESError(
      ECIESErrorTypeEnum.EncryptionFailed,
      undefined,
      undefined,
      undefined,
      {
        operation: 'encryptChunk',
        stackTrace: 'n/a',
        timestamp: ts,
      },
    );

    const report = err.getDetailedReport();
    expect(report).toContain('Timestamp: 2025-01-15T10:00:00.000Z');
  });

  it('getDetailedReport uses toISOString on Date without timestampSerializer', () => {
    const ts = new Date('2024-06-01T00:00:00Z');
    const err = new ECIESError(
      ECIESErrorTypeEnum.DecryptionFailed,
      undefined,
      undefined,
      undefined,
      {
        operation: 'decryptStream',
        stackTrace: 'n/a',
        timestamp: ts,
      },
    );

    const report = err.getDetailedReport();
    expect(report).toContain(ts.toISOString());
  });
});

// ---------------------------------------------------------------------------
// ECIESError — TDate = number (non-Unix epoch)
// ---------------------------------------------------------------------------

describe('ECIESError IErrorContext TDate = number (custom epoch)', () => {
  it('timestamp is stored as a number when provided', () => {
    const d = toDecimalDay(new Date('2025-05-01T00:00:00Z'));
    const err = new ECIESError<number>(
      ECIESErrorTypeEnum.EncryptionFailed,
      undefined,
      undefined,
      undefined,
      {
        operation: 'test',
        stackTrace: 'n/a',
        timestamp: d,
        timestampSerializer: decimalDaySerializer,
      },
    );

    expect(typeof err.context?.timestamp).toBe('number');
    expect(err.context?.timestamp).toBeCloseTo(d, 10);
  });

  it('getDetailedReport uses timestampSerializer to format the timestamp', () => {
    const date = new Date('2025-05-07T12:00:00Z');
    const d = toDecimalDay(date);

    const err = new ECIESError<number>(
      ECIESErrorTypeEnum.EncryptionFailed,
      undefined,
      undefined,
      undefined,
      {
        operation: 'encryptChunk',
        stackTrace: 'n/a',
        timestamp: d,
        timestampSerializer: decimalDaySerializer,
      },
    );

    const report = err.getDetailedReport();
    expect(report).toContain(`Timestamp: ${date.toISOString()}`);
  });

  it('without timestampSerializer the fallback treats the number as Unix ms', () => {
    // Documented limitation: the default fallback assumes Unix milliseconds.
    // Callers using a non-Unix number date type must provide timestampSerializer.
    const unixMs = Date.now();
    const err = new ECIESError<number>(
      ECIESErrorTypeEnum.EncryptionFailed,
      undefined,
      undefined,
      undefined,
      {
        operation: 'test',
        stackTrace: 'n/a',
        timestamp: unixMs,
      },
    );

    const report = err.getDetailedReport();
    expect(report).toContain(new Date(unixMs).toISOString());
  });

  it('timestamp defaults to a truthy value when omitted with TDate=number', () => {
    // Without a factory the fallback is new Date() cast to TDate.
    // Callers using number dates should always provide a timestamp.
    const err = new ECIESError<number>(
      ECIESErrorTypeEnum.EncryptionFailed,
      undefined,
      undefined,
      undefined,
      { operation: 'test', stackTrace: 'n/a' },
    );

    expect(err.context?.timestamp).toBeDefined();
  });
});
