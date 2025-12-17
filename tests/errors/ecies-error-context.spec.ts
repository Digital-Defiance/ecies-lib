import { ECIESErrorTypeEnum } from '../../src/enumerations/ecies-error-type';
import { ECIESError, IErrorContext } from '../../src/errors/ecies';
import { getEciesI18nEngine } from '../../src/i18n-setup';

describe('ECIESError with Context', () => {
  beforeAll(() => {
    getEciesI18nEngine();
  });

  describe('Basic Error Creation', () => {
    it('should create error without context', () => {
      const error = new ECIESError(
        ECIESErrorTypeEnum.InvalidECIESMultipleRecipientIdSize,
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ECIESError);
      expect(error.name).toBe('ECIESError');
      expect(error.context).toBeUndefined();
    });

    it('should create error with full context', () => {
      const context: IErrorContext = {
        operation: 'encryptChunk',
        stackTrace: new Error().stack ?? '',
        config: {
          idProviderName: 'ObjectId',
          idProviderByteLength: 12,
          memberIdLength: 12,
        },
        timestamp: new Date(),
        metadata: {
          recipientCount: 3,
          dataSize: 1024,
        },
      };

      const error = new ECIESError(
        ECIESErrorTypeEnum.InvalidECIESMultipleRecipientIdSize,
        undefined,
        undefined,
        undefined,
        context,
      );

      expect(error.context).toBeDefined();
      expect(error.context?.operation).toBe('encryptChunk');
      expect(error.context?.config?.idProviderName).toBe('ObjectId');
      expect(error.context?.metadata?.recipientCount).toBe(3);
    });

    it('should auto-fill missing context fields', () => {
      const error = new ECIESError(
        ECIESErrorTypeEnum.InvalidECIESMultipleRecipientIdSize,
        undefined,
        undefined,
        undefined,
        { operation: 'test' }, // Partial context
      );

      expect(error.context).toBeDefined();
      expect(error.context?.operation).toBe('test');
      expect(error.context?.timestamp).toBeInstanceOf(Date);
      expect(error.context?.stackTrace).toBeTruthy();
    });
  });

  describe('Context with Configuration Info', () => {
    it('should capture relevant config values', () => {
      const context: Partial<IErrorContext> = {
        operation: 'validateRecipientId',
        config: {
          idProviderName: 'GuidV4',
          idProviderByteLength: 16,
          memberIdLength: 16,
          recipientIdSize: 16,
          curveName: 'secp256k1',
        },
      };

      const error = new ECIESError(
        ECIESErrorTypeEnum.InvalidECIESMultipleRecipientIdSize,
        undefined,
        undefined,
        undefined,
        context,
      );

      expect(error.context?.config).toEqual({
        idProviderName: 'GuidV4',
        idProviderByteLength: 16,
        memberIdLength: 16,
        recipientIdSize: 16,
        curveName: 'secp256k1',
      });
    });

    it('should NOT include sensitive data in config', () => {
      // Config should only have non-sensitive metadata
      const context: Partial<IErrorContext> = {
        operation: 'encrypt',
        config: {
          idProviderName: 'ObjectId',
          idProviderByteLength: 12,
        },
      };

      const error = new ECIESError(
        ECIESErrorTypeEnum.InvalidECIESMultipleRecipientIdSize,
        undefined,
        undefined,
        undefined,
        context,
      );

      // Verify config doesn't have keys, mnemonics, etc.
      const configKeys = Object.keys(error.context?.config ?? {});
      expect(configKeys).not.toContain('privateKey');
      expect(configKeys).not.toContain('mnemonic');
      expect(configKeys).not.toContain('symmetricKey');
    });
  });

  describe('Metadata', () => {
    it('should capture operation-specific metadata', () => {
      const context: Partial<IErrorContext> = {
        operation: 'encryptChunk',
        metadata: {
          chunkIndex: 5,
          isLastChunk: false,
          recipientCount: 3,
          dataSize: 2048,
          expectedIdSize: 12,
          actualIdSize: 32,
        },
      };

      const error = new ECIESError(
        ECIESErrorTypeEnum.InvalidECIESMultipleRecipientIdSize,
        undefined,
        undefined,
        undefined,
        context,
      );

      expect(error.context?.metadata?.chunkIndex).toBe(5);
      expect(error.context?.metadata?.recipientCount).toBe(3);
      expect(error.context?.metadata?.expectedIdSize).toBe(12);
      expect(error.context?.metadata?.actualIdSize).toBe(32);
    });
  });

  describe('Stack Traces', () => {
    it('should capture stack trace', () => {
      const error = new ECIESError(
        ECIESErrorTypeEnum.InvalidECIESMultipleRecipientIdSize,
        undefined,
        undefined,
        undefined,
        { operation: 'test' },
      );

      expect(error.context?.stackTrace).toBeTruthy();
      expect(error.context?.stackTrace).toContain('Error');
    });

    it('should use provided stack trace', () => {
      const customStack = 'Custom\nStack\nTrace';
      const error = new ECIESError(
        ECIESErrorTypeEnum.InvalidECIESMultipleRecipientIdSize,
        undefined,
        undefined,
        undefined,
        { operation: 'test', stackTrace: customStack },
      );

      expect(error.context?.stackTrace).toBe(customStack);
    });
  });

  describe('Timestamps', () => {
    it('should capture timestamp', () => {
      const before = new Date();
      const error = new ECIESError(
        ECIESErrorTypeEnum.InvalidECIESMultipleRecipientIdSize,
        undefined,
        undefined,
        undefined,
        { operation: 'test' },
      );
      const after = new Date();

      expect(error.context?.timestamp).toBeInstanceOf(Date);
      expect(error.context?.timestamp!.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(error.context?.timestamp!.getTime()).toBeLessThanOrEqual(
        after.getTime(),
      );
    });
  });

  describe('Serialization', () => {
    it('should serialize to JSON with context', () => {
      const error = new ECIESError(
        ECIESErrorTypeEnum.InvalidECIESMultipleRecipientIdSize,
        undefined,
        undefined,
        undefined,
        {
          operation: 'encryptChunk',
          metadata: { recipientCount: 3 },
        },
      );

      const json = error.toJSON();

      expect(json.name).toBe('ECIESError');
      expect(json.type).toBe(
        ECIESErrorTypeEnum.InvalidECIESMultipleRecipientIdSize,
      );
      expect(json.context).toBeDefined();
      expect((json.context as any).operation).toBe('encryptChunk');
      expect((json.context as any).metadata.recipientCount).toBe(3);
    });

    it('should handle JSON.stringify', () => {
      const error = new ECIESError(
        ECIESErrorTypeEnum.InvalidECIESMultipleRecipientIdSize,
        undefined,
        undefined,
        undefined,
        { operation: 'test' },
      );

      const jsonString = JSON.stringify(error);
      expect(jsonString).toBeTruthy();

      const parsed = JSON.parse(jsonString);
      expect(parsed.name).toBe('ECIESError');
      expect(parsed.context.operation).toBe('test');
    });
  });

  describe('Detailed Report', () => {
    it('should generate detailed report', () => {
      const error = new ECIESError(
        ECIESErrorTypeEnum.InvalidECIESMultipleRecipientIdSize,
        undefined,
        undefined,
        undefined,
        {
          operation: 'encryptChunk',
          config: {
            idProviderName: 'ObjectId',
            idProviderByteLength: 12,
          },
          metadata: {
            expectedSize: 12,
            actualSize: 32,
          },
        },
      );

      const report = error.getDetailedReport();

      expect(report).toContain('ECIESError');
      expect(report).toContain('Operation: encryptChunk');
      expect(report).toContain('Configuration:');
      expect(report).toContain('idProviderName: ObjectId');
      expect(report).toContain('Metadata:');
      expect(report).toContain('expectedSize');
      expect(report).toContain('Stack Trace:');
    });

    it('should handle error without context', () => {
      const error = new ECIESError(
        ECIESErrorTypeEnum.InvalidECIESMultipleRecipientIdSize,
      );
      const report = error.getDetailedReport();

      expect(report).toContain('ECIESError');
      expect(report).not.toContain('Operation:');
      expect(report).not.toContain('Configuration:');
    });
  });

  describe('Real-World Scenarios', () => {
    it('should help debug the 12 vs 32 byte issue', () => {
      const error = new ECIESError(
        ECIESErrorTypeEnum.InvalidECIESMultipleRecipientIdSize,
        undefined,
        undefined,
        undefined,
        {
          operation: 'encryptChunk',
          config: {
            idProviderName: 'ObjectId',
            idProviderByteLength: 12,
            memberIdLength: 12,
            recipientIdSize: 32, // The bug!
          },
          metadata: {
            expectedSize: 12,
            actualSize: 32,
            recipientIndex: 0,
          },
        },
      );

      const report = error.getDetailedReport();

      // Should clearly show the mismatch
      expect(report).toContain('idProviderByteLength: 12');
      expect(report).toContain('recipientIdSize: 32');
      expect(report).toContain('expectedSize');
      expect(report).toContain('actualSize');
    });

    it('should help debug decryption failures', () => {
      const error = new ECIESError(
        ECIESErrorTypeEnum.InvalidECIESMultipleRecipientIdSize,
        undefined,
        undefined,
        undefined,
        {
          operation: 'decryptChunk',
          config: {
            idProviderName: 'GuidV4',
            idProviderByteLength: 16,
          },
          metadata: {
            chunkIndex: 42,
            recipientIdProvided: true,
            recipientIdLength: 12, // Wrong provider!
          },
        },
      );

      const json = error.toJSON();

      expect(json.context).toBeDefined();
      expect((json.context as any).config.idProviderByteLength).toBe(16);
      expect((json.context as any).metadata.recipientIdLength).toBe(12);
    });
  });
});
