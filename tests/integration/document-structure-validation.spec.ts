/**
 * Document Structure Validation Tests
 *
 * Validates that the DD-ECIES specification document, BrightChain docs copy,
 * ecies-lib README, and WCAP specification contain the required structure
 * and content as defined in the requirements.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.5, 1.6, 14.1, 14.2, 14.3, 16.4
 */
import * as fs from 'fs';
import * as path from 'path';

/**
 * Resolve the BrightChain workspace root.
 *
 * The express-suite repo is a sibling of BrightChain on disk (BrightChain
 * symlinks to it via `express-suite -> ../express-suite`). From the test
 * file's __dirname we walk up to the express-suite root, then look for
 * BrightChain as a sibling directory.
 */
function findBrightChainRoot(): string {
  // __dirname = .../express-suite/packages/digitaldefiance-ecies-lib/tests/integration
  // express-suite root = 4 levels up
  const expressRoot = path.resolve(__dirname, '..', '..', '..', '..');
  const parentDir = path.resolve(expressRoot, '..');
  const candidate = path.join(parentDir, 'BrightChain');
  if (fs.existsSync(candidate)) {
    return candidate;
  }
  // Fallback: maybe we're already inside BrightChain (non-symlink layout)
  // Walk up from __dirname looking for WCAP/
  let dir = __dirname;
  for (let i = 0; i < 10; i++) {
    dir = path.resolve(dir, '..');
    if (fs.existsSync(path.join(dir, 'WCAP'))) {
      return dir;
    }
  }
  throw new Error(
    'Could not locate BrightChain workspace root from ' + __dirname,
  );
}

// ecies-lib package root (2 levels up from tests/integration)
const eciesLibRoot = path.resolve(__dirname, '..', '..');

const DD_ECIES_SPEC_PATH = path.join(
  eciesLibRoot,
  'docs',
  'DD-ECIES-SPECIFICATION.md',
);
const README_PATH = path.join(eciesLibRoot, 'README.md');

let brightChainRoot: string;
let BRIGHTCHAIN_DOCS_COPY_PATH: string;
let WCAP_SPEC_PATH: string;

try {
  brightChainRoot = findBrightChainRoot();
  BRIGHTCHAIN_DOCS_COPY_PATH = path.join(
    brightChainRoot,
    'docs',
    'DD-ECIES-SPECIFICATION.md',
  );
  WCAP_SPEC_PATH = path.join(
    brightChainRoot,
    'WCAP',
    'Web Content Authenticity Protocol (WCAP).md',
  );
} catch {
  // Will be handled in beforeAll
  BRIGHTCHAIN_DOCS_COPY_PATH = '';
  WCAP_SPEC_PATH = '';
}

describe('Document Structure Validation', () => {
  let ddEciesSpec: string;
  let brightchainDocsCopy: string;
  let readme: string;
  let wcapSpec: string;

  beforeAll(() => {
    ddEciesSpec = fs.readFileSync(DD_ECIES_SPEC_PATH, 'utf-8');
    brightchainDocsCopy = fs.readFileSync(BRIGHTCHAIN_DOCS_COPY_PATH, 'utf-8');
    readme = fs.readFileSync(README_PATH, 'utf-8');
    wcapSpec = fs.readFileSync(WCAP_SPEC_PATH, 'utf-8');
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

  describe('BrightChain Docs Copy (Req 1.5)', () => {
    it('should exist at docs/DD-ECIES-SPECIFICATION.md', () => {
      expect(fs.existsSync(BRIGHTCHAIN_DOCS_COPY_PATH)).toBe(true);
    });

    it('should contain the canonical reference header note', () => {
      // The header should indicate this is a copy and reference the canonical location
      expect(brightchainDocsCopy).toMatch(
        /canonical.*specification.*express-suite\/packages\/digitaldefiance-ecies-lib\/docs\/DD-ECIES-SPECIFICATION\.md/i,
      );
    });

    it('should state that the canonical version takes precedence', () => {
      expect(brightchainDocsCopy).toMatch(/canonical.*takes precedence/i);
    });
  });

  describe('ecies-lib README Spec Link (Req 1.6)', () => {
    it('should contain a link to the DD-ECIES specification', () => {
      // The README should link to the spec document
      expect(readme).toMatch(/DD-ECIES.*Specification/i);
      expect(readme).toMatch(/DD-ECIES-SPECIFICATION\.md/);
    });
  });

  describe('WCAP Algorithm Suite Registry (Req 14.1)', () => {
    it('should contain an Algorithm Suite Registry section', () => {
      expect(wcapSpec).toMatch(/## .*Algorithm Suite Registry/);
    });
  });

  describe('WCAP Registered Algorithm Suites (Req 14.2, 14.3)', () => {
    it('should list ecdsa-p256-sha256 as a registered suite', () => {
      expect(wcapSpec).toMatch(/ecdsa-p256-sha256/);
    });

    it('should list dd-ecies-secp256k1-sha256 as a registered suite', () => {
      expect(wcapSpec).toMatch(/dd-ecies-secp256k1-sha256/);
    });
  });

  describe('WCAP Content-Signature Header kid Parameter (Req 16.4)', () => {
    it('should include kid parameter in the Content-Signature header format', () => {
      // The WCAP spec should define kid as a parameter
      expect(wcapSpec).toMatch(/kid/);
    });

    it('should specify kid as OPTIONAL', () => {
      // kid should be marked as OPTIONAL
      expect(wcapSpec).toMatch(/`kid`.*OPTIONAL|kid.*OPTIONAL/i);
    });
  });
});
