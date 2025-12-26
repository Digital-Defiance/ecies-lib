import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  ECIESService,
  VotingService,
  ISimpleKeyPair,
  uint8ArrayToHex,
} from '@digitaldefiance/ecies-lib';
import type { KeyPair } from 'paillier-bigint';
import {
  FaLock,
  FaUnlock,
  FaKey,
  FaExchangeAlt,
  FaVoteYea,
} from 'react-icons/fa';
import './Demo.css';

const Demo = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [service] = useState(() => new ECIESService());
  const [aliceKeys, setAliceKeys] = useState<ISimpleKeyPair | null>(null);
  const [bobKeys, setBobKeys] = useState<ISimpleKeyPair | null>(null);
  const [message, setMessage] = useState('Hello, secure world!');
  const [encryptedData, setEncryptedData] = useState<Uint8Array | null>(null);
  const [decryptedMessage, setDecryptedMessage] = useState<string>('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);

  // Voting Demo State
  const [votingService] = useState(() => VotingService.getInstance());
  const [aliceVotingKeys, setAliceVotingKeys] = useState<KeyPair | null>(null);
  const [voteA, setVoteA] = useState<number>(1);
  const [voteB, setVoteB] = useState<number>(5);
  const [encryptedTally, setEncryptedTally] = useState<bigint | null>(null);
  const [decryptedTally, setDecryptedTally] = useState<number | null>(null);
  const [isDerivingVotingKeys, setIsDerivingVotingKeys] = useState(false);
  const [votingError, setVotingError] = useState<string | null>(null);

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

  useEffect(() => {
    const deriveKeys = async () => {
      if (aliceKeys) {
        setIsDerivingVotingKeys(true);
        setVotingError(null);
        try {
          // Use a smaller key size for demo performance (1024 bits)
          // In production, use default (3072 bits)
          const keys = await votingService.deriveVotingKeysFromECDH(
            aliceKeys.privateKey,
            aliceKeys.publicKey,
            { keypairBitLength: 1024, primeTestIterations: 10 },
          );
          setAliceVotingKeys(keys);
        } catch (e) {
          console.error('Failed to derive voting keys', e);
          setVotingError(
            e instanceof Error ? e.message : 'Unknown error deriving keys',
          );
        } finally {
          setIsDerivingVotingKeys(false);
        }
      }
    };
    deriveKeys();
  }, [aliceKeys, votingService]);

  const handleVote = async () => {
    if (!aliceVotingKeys) return;

    // Encrypt Vote A
    const encA = aliceVotingKeys.publicKey.encrypt(BigInt(voteA));

    // Encrypt Vote B
    const encB = aliceVotingKeys.publicKey.encrypt(BigInt(voteB));

    // Homomorphic Addition (Encrypted Sum)
    // We are adding the encrypted values without decrypting them!
    const sum = aliceVotingKeys.publicKey.addition(encA, encB);
    setEncryptedTally(sum);

    setDecryptedTally(null);
  };

  const handleTally = async () => {
    if (!aliceVotingKeys || !encryptedTally) return;

    const result = aliceVotingKeys.privateKey.decrypt(encryptedTally);
    setDecryptedTally(Number(result));
  };

  const handleEncrypt = async () => {
    if (!bobKeys || !message) return;
    setIsEncrypting(true);
    try {
      const messageBytes = new TextEncoder().encode(message);
      // Encrypt for Bob using his public key
      const encrypted = await service.encryptSimpleOrSingle(
        false, // Use Single mode (includes length prefix)
        bobKeys.publicKey,
        messageBytes,
      );
      setEncryptedData(encrypted);
      setDecryptedMessage(''); // Clear previous decryption
    } catch (error) {
      console.error('Encryption failed:', error);
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
        encryptedData,
      );
      setDecryptedMessage(new TextDecoder().decode(decrypted));
    } catch (error) {
      console.error('Decryption failed:', error);
      setDecryptedMessage('Error: Decryption failed');
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
                'Encrypting...'
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

            <div style={{ marginTop: '1rem' }}>
              <button
                className="demo-btn"
                onClick={handleDecrypt}
                disabled={isDecrypting || !encryptedData}
                style={{ background: 'var(--accent-color)' }}
              >
                {isDecrypting ? (
                  'Decrypting...'
                ) : (
                  <>
                    <FaUnlock /> Decrypt Message
                  </>
                )}
              </button>
            </div>

            {decryptedMessage && (
              <div className="demo-result" style={{ marginTop: '1rem' }}>
                <h4>Decrypted Message:</h4>
                <div
                  className="demo-textarea"
                  style={{ background: 'var(--bg-primary)' }}
                >
                  {decryptedMessage}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        <motion.div
          className="demo-card"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          style={{ marginTop: '2rem', maxWidth: '100%' }}
        >
          <h3>
            <FaVoteYea /> Homomorphic Voting Demo
          </h3>
          <p style={{ marginBottom: '1rem', opacity: 0.8 }}>
            This demo shows how we can add two encrypted numbers together
            without decrypting them. The voting keys are derived
            deterministically from Alice's ECDH identity.
          </p>

          {votingError && (
            <div
              style={{
                padding: '1rem',
                background: 'rgba(255,0,0,0.1)',
                border: '1px solid red',
                borderRadius: '8px',
                color: '#ff6b6b',
                marginBottom: '1rem',
              }}
            >
              <p>
                <strong>Error initializing voting demo:</strong> {votingError}
              </p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                This might be due to missing dependencies or browser
                compatibility issues.
              </p>
            </div>
          )}

          {isDerivingVotingKeys && (
            <div
              style={{
                padding: '1rem',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '8px',
              }}
            >
              Deriving Paillier Keys (this may take a moment)...
            </div>
          )}

          {aliceVotingKeys && (
            <div className="voting-demo-container">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <div className="demo-input-group">
                  <label>Vote A (Number):</label>
                  <input
                    type="number"
                    value={voteA}
                    onChange={(e) => setVoteA(parseInt(e.target.value) || 0)}
                    className="demo-textarea"
                    style={{ height: 'auto', padding: '0.5rem' }}
                  />
                </div>
                <div className="demo-input-group">
                  <label>Vote B (Number):</label>
                  <input
                    type="number"
                    value={voteB}
                    onChange={(e) => setVoteB(parseInt(e.target.value) || 0)}
                    className="demo-textarea"
                    style={{ height: 'auto', padding: '0.5rem' }}
                  />
                </div>
              </div>

              <button className="demo-btn" onClick={handleVote}>
                <FaLock /> Encrypt & Sum Votes
              </button>

              {encryptedTally && (
                <div className="demo-result" style={{ marginTop: '1rem' }}>
                  <h4>Encrypted Sum (BigInt):</h4>
                  <div
                    className="hex-display"
                    style={{
                      maxHeight: '100px',
                      overflow: 'auto',
                      wordBreak: 'break-all',
                    }}
                  >
                    {encryptedTally.toString()}
                  </div>
                  <p
                    style={{
                      fontSize: '0.8rem',
                      marginTop: '0.5rem',
                      opacity: 0.7,
                    }}
                  >
                    This value is the encrypted sum of Vote A and Vote B. It was
                    calculated by multiplying the ciphertexts (Paillier
                    property).
                  </p>
                </div>
              )}

              {encryptedTally && (
                <div style={{ marginTop: '1rem' }}>
                  <button
                    className="demo-btn"
                    onClick={handleTally}
                    style={{ background: 'var(--accent-color)' }}
                  >
                    <FaUnlock /> Decrypt Tally
                  </button>
                </div>
              )}

              {decryptedTally !== null && (
                <div
                  className="demo-result"
                  style={{ marginTop: '1rem', borderLeft: '4px solid #4ade80' }}
                >
                  <h4 style={{ color: '#4ade80' }}>
                    Decrypted Result: {decryptedTally}
                  </h4>
                  <p>
                    {decryptedTally === voteA + voteB
                      ? '✅ Correct! The sum matches (A + B).'
                      : '❌ Error: Sum mismatch.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Demo;
