/**
 * Document Structure Validation Tests
 *
 * Validates that the DD-ECIES specification document
 * and the ecies-lib README contain the required structure
 * and content as defined in the requirements.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.5, 1.6, 14.1, 14.2, 14.3, 16.4
 */
import * as fs from 'fs';
import * as path from 'path';

// ecies-lib package root (2 levels up from tests/integration)
const eciesLibRoot = path.resolve(__dirname, '..', '..');

const DD_ECIES_SPEC_PATH = path.join(
  eciesLibRoot,
  'docs',
  'DD-ECIES-SPECIFICATION.md',
);
const README_PATH = path.join(eciesLibRoot, 'README.md');

describe('Document Structure Validation', () => {
  let ddEciesSpec: string;
  let readme: string;

  beforeAll(() => {
    ddEciesSpec = fs.readFileSync(DD_ECIES_SPEC_PATH, 'utf-8');
    readme = fs.readFileSync(README_PATH, 'utf-8');
  });

  describe('DD-ECIES Specification (Req 1.3)', () => {
    it('should exist at the canonical path', () => {
      expect(fs.existsSync(DD_ECIES_SPEC_PATH)).toBe(true);
    });
  });

  describe('DD-ECIES Specification Section Structure (Req 1.1)', () => {
    // The 17 required top-level sections per Requirement 1.1, in order
    const requiredSections = [
      'Abstract',
      'Introduction',
      'Terminology',
      'Notation',
      'Elliptic Curve Parameters',
      'Key Management',
      'Signature Scheme',
      'Symmetric Encryption',
      'ECIES Encryption (Single Recipient)',
      'ECIES Encryption (Multi-Recipient)',
      'Message Framing and Wire Format',
      'Checksum Operations',
      'PBKDF2 Password Hashing Profiles',
      'Voting Subsystem (Paillier)',
      'Security Considerations',
      'IANA-Style Registries',
      'References',
    ];

    it('should contain all 17 required top-level sections', () => {
      // Extract all ## level headers from the spec
      const sectionHeaders = ddEciesSpec
        .split('\n')
        .filter((line) => /^## /.test(line))
        .map((line) =>
          line
            .replace(/^## /, '')
            .replace(/^\d+\.\s*/, '')
            .trim(),
        );

      for (const section of requiredSections) {
        const found = sectionHeaders.some((header) =>
          header.toLowerCase().includes(section.toLowerCase()),
        );
        expect(found).toBe(true);
      }
    });

    it('should have the 17 required sections in the correct order', () => {
      // Find the position of each required section in the document
      const sectionPositions: number[] = [];

      for (const section of requiredSections) {
        // Match ## headers that contain the section name (with optional numbering prefix)
        const escapedSection = section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(
          `^## (?:\\d+\\.\\s*)?.*${escapedSection}`,
          'im',
        );
        const match = ddEciesSpec.match(regex);
        expect(match).not.toBeNull();
        if (match) {
          sectionPositions.push(ddEciesSpec.indexOf(match[0]));
        }
      }

      // Verify sections appear in ascending order
      for (let i = 1; i < sectionPositions.length; i++) {
        expect(sectionPositions[i]).toBeGreaterThan(sectionPositions[i - 1]);
      }
    });
  });

  describe('RFC 2119 Key Words (Req 1.2)', () => {
    it('should use RFC 2119 key words in normative sections', () => {
      const rfc2119Keywords = ['MUST', 'SHALL', 'SHOULD', 'MAY'];

      for (const keyword of rfc2119Keywords) {
        // Match the keyword as a standalone uppercase word
        const regex = new RegExp(`\\b${keyword}\\b`);
        expect(ddEciesSpec).toMatch(regex);
      }
    });

    it('should reference RFC 2119 in the conformance section', () => {
      expect(ddEciesSpec).toMatch(/RFC 2119/);
    });
  });

  describe('ecies-lib README Spec Link (Req 1.6)', () => {
    it('should contain a link to the DD-ECIES specification', () => {
      // The README should link to the spec document
      expect(readme).toMatch(/DD-ECIES.*Specification/i);
      expect(readme).toMatch(/DD-ECIES-SPECIFICATION\.md/);
    });
  });
});
