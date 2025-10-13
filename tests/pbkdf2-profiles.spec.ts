import { PBKDF2_PROFILES } from '../src/defaults';
import { Pbkdf2ProfileEnum } from '../src/enumerations';

describe('PBKDF2 Profiles', () => {
  it('should have a profile for browser passwords', () => {
    const profile = PBKDF2_PROFILES[Pbkdf2ProfileEnum.BROWSER_PASSWORD];
    expect(profile).toBeDefined();
    expect(profile.hashBytes).toBe(32);
    expect(profile.saltBytes).toBe(64);
    expect(profile.iterations).toBe(2000000);
    expect(profile.algorithm).toBe('SHA-512');
  });
});
