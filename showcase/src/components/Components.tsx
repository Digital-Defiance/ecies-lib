import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { FaGithub } from "react-icons/fa";
import { SiNpm } from "react-icons/si";
import "./Components.css";

interface Feature {
  title: string;
  description: string;
  icon: string;
  tech: string[];
  github?: string;
  npm?: string;
  highlights: string[];
  category: "Crypto" | "Identity" | "Advanced" | "Security" | "Integration" | "Voting";
}

const features: Feature[] = [
  {
    title: "ECIES v4.0 Protocol",
    icon: "🛡️",
    description:
      "Modern ECIES implementation with HKDF-SHA256 key derivation, AAD binding for tamper prevention, and shared ephemeral key optimization for multi-recipient encryption.",
    tech: ["HKDF-SHA256", "AES-256-GCM", "secp256k1", "AAD Binding"],
    category: "Crypto",
    highlights: [
      "HKDF-SHA256: Cryptographically robust key derivation (RFC 5869)",
      "AAD Binding: Header metadata and recipient IDs bound to encryption context",
      "Shared Ephemeral Key: Optimized multi-recipient encryption",
      "Compressed Keys: 33-byte compressed public keys for efficiency",
      "Three modes: Simple, Single, and Multiple (up to 65,535 recipients)",
    ],
  },
  {
    title: "Government-Grade Voting",
    icon: "🗳️",
    description:
      "Comprehensive voting system with homomorphic encryption (Paillier), 17 voting methods, verifiable receipts, and immutable audit logs. 1100+ test cases.",
    tech: ["Paillier", "Homomorphic", "ECDSA", "Merkle Tree"],
    category: "Advanced",
    highlights: [
      "17 voting methods: Plurality, Approval, Ranked Choice, STAR, STV, etc.",
      "Homomorphic encryption: Votes remain encrypted until tally",
      "Verifiable receipts: ECDSA signatures for vote verification",
      "Audit log: Immutable hash-chained audit trail",
      "Bulletin board: Append-only with Merkle tree integrity",
    ],
  },
  {
    title: "Pluggable ID Providers",
    icon: "🆔",
    description:
      "Flexible identifier system supporting ObjectId (12 bytes), GUID/UUID (16 bytes), or custom formats (1-255 bytes). Configuration automatically adapts all cryptographic constants.",
    tech: ["ObjectId", "GUID", "UUID", "Custom IDs"],
    category: "Identity",
    highlights: [
      "ObjectIdProvider: 12-byte MongoDB-style IDs (default)",
      "GuidV4Provider: 16-byte raw GUIDs with base64 serialization",
      "UuidProvider: 16-byte UUIDs with standard dash formatting",
      "CustomIdProvider: Any byte length (1-255 bytes)",
      "Auto-sync: Configuration adapts all constants to ID provider",
    ],
  },
  {
    title: "BIP39 & HD Wallets",
    icon: "🔑",
    description:
      "Complete key management with BIP39 mnemonic phrase generation (12-24 words) and BIP32/BIP44 hierarchical deterministic wallet derivation.",
    tech: ["BIP39", "BIP32", "BIP44", "Mnemonics"],
    category: "Identity",
    highlights: [
      "BIP39: Mnemonic phrase generation (12-24 words)",
      "HD Wallets: BIP32/BIP44 hierarchical deterministic derivation",
      "Secure Storage: SecureString and SecureBuffer with XOR obfuscation",
      "Auto-zeroing: Memory-safe sensitive data handling",
      "Cross-platform: Works in browser and Node.js",
    ],
  },
  {
    title: "Streaming Encryption",
    icon: "🚀",
    description:
      "Memory-efficient processing for large files with less than 10MB RAM usage for any file size. Includes progress tracking with throughput and ETA.",
    tech: ["Streaming", "Chunking", "Progress Tracking"],
    category: "Advanced",
    highlights: [
      "Memory efficient: <10MB RAM for any file size",
      "Single-recipient streaming: ~50-100 MB/s throughput",
      "Multi-recipient streaming: ~40-80 MB/s throughput",
      "Progress tracking: Real-time throughput, ETA, completion %",
      "Chunk processing: Configurable chunk sizes",
    ],
  },
  {
    title: "Member System",
    icon: "👤",
    description:
      "High-level user abstraction integrating keys, IDs, and encryption operations. Includes fluent builder API and JSON serialization with ID provider support.",
    tech: ["TypeScript", "Builder Pattern", "Serialization"],
    category: "Identity",
    highlights: [
      "Member class: User abstraction with cryptographic operations",
      "MemberBuilder: Fluent API for member creation",
      "ID integration: Fully integrated with configured ID provider",
      "JSON serialization: toJson() and fromJson() with ID provider",
      "Encryption helpers: encryptData(), decryptData(), sign(), verify()",
    ],
  },
  {
    title: "Internationalization",
    icon: "🌍",
    description:
      "Automatic error translation in 8 languages with comprehensive i18n support. All error messages are localized and type-safe.",
    tech: ["i18n", "8 Languages", "Type-Safe"],
    category: "Integration",
    highlights: [
      "8 languages: en-US, en-GB, fr, es, de, zh-CN, ja, uk",
      "Automatic translation: Error messages localized automatically",
      "Type-safe: Full TypeScript support for translations",
      "Component-based: i18n engine with component registration",
      "Extensible: Add custom translations easily",
    ],
  },
  {
    title: "Security Hardening",
    icon: "🔒",
    description:
      "Comprehensive security validations across all layers including key validation, size bounds checking, and safe accumulation with overflow detection.",
    tech: ["Validation", "Bounds Checking", "Overflow Detection"],
    category: "Security",
    highlights: [
      "Key validation: Public/private key all-zeros checks",
      "Size validation: Message size limits (max 2GB)",
      "AES-GCM validation: Key length, IV length, data validation",
      "Multi-recipient: Chunk index bounds, safe accumulation",
      "< 0.1% overhead: Minimal performance impact",
    ],
  },
  {
    title: "Runtime Configuration",
    icon: "⚙️",
    description:
      "Injectable configuration profiles via ConstantsRegistry for dependency injection and testing. Create isolated configurations for different contexts.",
    tech: ["DI", "Configuration", "Testing"],
    category: "Integration",
    highlights: [
      "ConstantsRegistry: Named configuration management",
      "createRuntimeConfiguration: Validated config creation",
      "Multiple instances: Isolated engines for different contexts",
      "Testing support: Easy mocking and configuration override",
      "Type-safe: Full TypeScript support for configuration",
    ],
  },
  {
    title: "Cross-Platform",
    icon: "🌐",
    description:
      "Fully compatible with Node.js 18+ and modern browsers. Binary compatible with @digitaldefiance/node-ecies-lib for seamless cross-platform operations.",
    tech: ["Web Crypto API", "Node.js", "Browser"],
    category: "Integration",
    highlights: [
      "Browser: Chrome, Edge, Firefox, Safari support",
      "Node.js: 18+ with Web Crypto API built-in",
      "Binary compatible: Same version node-ecies-lib interop",
      "Cross-platform: Encrypt in browser, decrypt in Node.js",
      "E2E tested: Comprehensive compatibility test suite",
    ],
  },
];

const Components = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section className="components section" id="components" ref={ref}>
      <motion.div
        className="components-container"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
      >
        <h2 className="section-title">
          Key <span className="gradient-text">Features</span>
        </h2>
        <p className="components-subtitle">
          Production-ready ECIES encryption for browser and Node.js applications
        </p>

        <motion.div
          className="suite-intro"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3>
            Enterprise-grade <em>ECIES encryption</em> with{" "}
            <em>streaming support</em>, <em>voting system</em>, and <em>cross-platform compatibility</em>
          </h3>
          <p>
            <strong>
              @digitaldefiance/ecies-lib brings modern cryptography to TypeScript.
            </strong>{" "}
            This isn't just another encryption library—it's a complete
            cryptographic toolkit with{" "}
            <strong>ECIES v4.0 protocol</strong>,{" "}
            <strong>pluggable ID providers</strong>,{" "}
            <strong>government-grade voting</strong>, and{" "}
            <strong>memory-efficient streaming</strong>.
          </p>
          <div className="problem-solution">
            <div className="problem">
              <h4>❌ The Problem: Cryptography Is Hard</h4>
              <ul>
                <li>Implementing ECIES correctly requires deep expertise</li>
                <li>Key management and derivation are error-prone</li>
                <li>Large file encryption exhausts memory</li>
                <li>Cross-platform compatibility is challenging</li>
                <li>ID format flexibility is often missing</li>
              </ul>
              <p>
                <strong>Result:</strong> You spend months building crypto
                infrastructure instead of features.
              </p>
            </div>
            <div className="solution">
              <h4>✅ The Solution: Production-Ready ECIES</h4>
              <p>
                <strong>ecies-lib</strong> provides{" "}
                <strong>ECIES v4.0 with HKDF key derivation</strong>,{" "}
                <strong>pluggable ID providers</strong> for flexible identifiers,{" "}
                <strong>streaming encryption</strong> for large files,{" "}
                <strong>government-grade voting</strong> with homomorphic encryption, and{" "}
                <strong>binary compatibility</strong> with node-ecies-lib.
              </p>
              <p>
                Built with <strong>Web Crypto API</strong> and{" "}
                <strong>@noble/curves</strong>, this library includes 1,200+
                tests and comprehensive security hardening. It provides
                everything you need for secure encryption in browser and Node.js.
              </p>
            </div>
          </div>
          <div className="value-props">
            <div className="value-prop">
              <strong>🛡️ Protocol v4.0</strong>
              <p>
                HKDF-SHA256 key derivation, AAD binding, and optimized
                multi-recipient encryption
              </p>
            </div>
            <div className="value-prop">
              <strong>🗳️ Voting System</strong>
              <p>
                17 voting methods with homomorphic encryption, verifiable
                receipts, and audit logs
              </p>
            </div>
            <div className="value-prop">
              <strong>🆔 Pluggable IDs</strong>
              <p>
                ObjectId, GUID, UUID, or custom formats with automatic
                configuration sync
              </p>
            </div>
            <div className="value-prop">
              <strong>🌐 Cross-Platform</strong>
              <p>
                Binary compatible between browser and Node.js with same version
                node-ecies-lib
              </p>
            </div>
          </div>
        </motion.div>

        <div className="components-grid">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="component-card card"
              initial={{ opacity: 0, y: 50 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.1, duration: 0.6 }}
            >
              <div className="component-header">
                <div className="component-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <span
                  className={`component-badge ${feature.category.toLowerCase()}`}
                >
                  {feature.category}
                </span>
              </div>

              <p className="component-description">{feature.description}</p>

              <ul className="component-highlights">
                {feature.highlights.map((highlight, i) => (
                  <li key={i}>{highlight}</li>
                ))}
              </ul>

              <div className="component-tech">
                {feature.tech.map((tech) => (
                  <span key={tech} className="tech-badge">
                    {tech}
                  </span>
                ))}
              </div>

              {feature.github && (
                <div className="component-links">
                  <a
                    href={feature.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="component-link"
                  >
                    <FaGithub />
                    GitHub
                  </a>
                  {feature.npm && (
                    <a
                      href={feature.npm}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="component-link"
                    >
                      <SiNpm />
                      NPM
                    </a>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default Components;
