import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  ECIESService,
  ISimpleKeyPair,
  uint8ArrayToHex,
} from "@digitaldefiance/ecies-lib";
import { FaLock, FaUnlock, FaKey, FaExchangeAlt } from "react-icons/fa";
import "./Demo.css";

const Demo = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [service] = useState(() => new ECIESService());
  const [aliceKeys, setAliceKeys] = useState<ISimpleKeyPair | null>(null);
  const [bobKeys, setBobKeys] = useState<ISimpleKeyPair | null>(null);
  const [message, setMessage] = useState("Hello, secure world!");
  const [encryptedData, setEncryptedData] = useState<Uint8Array | null>(null);
  const [decryptedMessage, setDecryptedMessage] = useState<string>("");
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);

  useEffect(() => {
    // Generate keys on mount
    const generateKeys = async () => {
      const aliceMnemonic = service.generateNewMnemonic();
      const alice = service.mnemonicToSimpleKeyPair(aliceMnemonic);
      setAliceKeys(alice);

      const bobMnemonic = service.generateNewMnemonic();
      const bob = service.mnemonicToSimpleKeyPair(bobMnemonic);
      setBobKeys(bob);
    };
    generateKeys();
  }, [service]);

  const handleEncrypt = async () => {
    if (!bobKeys || !message) return;
    setIsEncrypting(true);
    try {
      const messageBytes = new TextEncoder().encode(message);
      // Encrypt for Bob using his public key
      const encrypted = await service.encryptSimpleOrSingle(
        false, // Use Single mode (includes length prefix)
        bobKeys.publicKey,
        messageBytes
      );
      setEncryptedData(encrypted);
      setDecryptedMessage(""); // Clear previous decryption
    } catch (error) {
      console.error("Encryption failed:", error);
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleDecrypt = async () => {
    if (!bobKeys || !encryptedData) return;
    setIsDecrypting(true);
    try {
      // Decrypt using Bob's private key
      const decrypted = await service.decryptSimpleOrSingleWithHeader(
        false,
        bobKeys.privateKey,
        encryptedData
      );
      setDecryptedMessage(new TextDecoder().decode(decrypted));
    } catch (error) {
      console.error("Decryption failed:", error);
      setDecryptedMessage("Error: Decryption failed");
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <section className="demo-section" id="demo" ref={ref}>
      <motion.div
        className="demo-container"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
      >
        <h2 className="section-title">
          Interactive <span className="gradient-text">Demo</span>
        </h2>
        <p className="features-subtitle">
          Experience ECIES encryption in real-time directly in your browser
        </p>

        <div className="demo-grid">
          {/* Alice's Side */}
          <motion.div
            className="demo-card"
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2 }}
          >
            <h3>
              <FaKey /> Alice (Sender)
            </h3>
            {aliceKeys && (
              <div className="key-display">
                <span className="key-label">Public Key (Compressed):</span>
                {uint8ArrayToHex(aliceKeys.publicKey)}
              </div>
            )}

            <div className="demo-input-group">
              <label>Message to Encrypt:</label>
              <textarea
                className="demo-textarea"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter a secret message..."
              />
            </div>

            <button
              className="demo-btn"
              onClick={handleEncrypt}
              disabled={isEncrypting || !bobKeys}
            >
              {isEncrypting ? (
                "Encrypting..."
              ) : (
                <>
                  <FaLock /> Encrypt for Bob
                </>
              )}
            </button>
          </motion.div>

          {/* Bob's Side */}
          <motion.div
            className="demo-card"
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.4 }}
          >
            <h3>
              <FaKey /> Bob (Receiver)
            </h3>
            {bobKeys && (
              <div className="key-display">
                <span className="key-label">Public Key (Compressed):</span>
                {uint8ArrayToHex(bobKeys.publicKey)}
              </div>
            )}

            {encryptedData && (
              <div className="demo-result">
                <h4>
                  <FaExchangeAlt /> Encrypted Payload (Hex):
                </h4>
                <div className="hex-display">
                  {uint8ArrayToHex(encryptedData)}
                </div>
              </div>
            )}

            <div style={{ marginTop: "1rem" }}>
              <button
                className="demo-btn"
                onClick={handleDecrypt}
                disabled={isDecrypting || !encryptedData}
                style={{ background: "var(--accent-color)" }}
              >
                {isDecrypting ? (
                  "Decrypting..."
                ) : (
                  <>
                    <FaUnlock /> Decrypt Message
                  </>
                )}
              </button>
            </div>

            {decryptedMessage && (
              <div className="demo-result" style={{ marginTop: "1rem" }}>
                <h4>Decrypted Message:</h4>
                <div
                  className="demo-textarea"
                  style={{ background: "var(--bg-primary)" }}
                >
                  {decryptedMessage}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default Demo;
