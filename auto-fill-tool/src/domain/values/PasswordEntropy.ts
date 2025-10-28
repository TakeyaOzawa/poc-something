/**
 * Password Entropy Calculator
 *
 * Calculates password strength based on information theory entropy.
 * Provides concrete metrics (bits, crack time) to motivate users
 * to create stronger passwords.
 *
 * References:
 * - NIST SP 800-63B: Digital Identity Guidelines
 * - Information Theory: Entropy = log2(possibilities)
 * - Crack time assumes 1 billion attempts/second (modern GPU)
 */

export class PasswordEntropy {
  /**
   * Calculate password entropy in bits
   *
   * Formula: Entropy = Length × log2(Character Pool Size)
   *
   * Character pools:
   * - Lowercase (a-z): 26 characters
   * - Uppercase (A-Z): 26 characters
   * - Numbers (0-9): 10 characters
   * - Special chars: 32 characters (!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~)
   *
   * @param password - Password to analyze
   * @returns Entropy in bits (0 if empty)
   *
   * @example
   * PasswordEntropy.calculate('abc')       // 14 bits (3 × log2(26))
   * PasswordEntropy.calculate('Abc123')    // 35 bits (6 × log2(62))
   * PasswordEntropy.calculate('Abc123!@#') // 58 bits (9 × log2(94))
   */
  static calculate(password: string): number {
    if (!password || password.trim() === '') {
      return 0;
    }

    // Determine character pool size based on character types used
    let poolSize = 0;

    // Check for lowercase letters (a-z)
    if (/[a-z]/.test(password)) {
      poolSize += 26;
    }

    // Check for uppercase letters (A-Z)
    if (/[A-Z]/.test(password)) {
      poolSize += 26;
    }

    // Check for numbers (0-9)
    if (/[0-9]/.test(password)) {
      poolSize += 10;
    }

    // Check for special characters
    if (/[^a-zA-Z0-9]/.test(password)) {
      poolSize += 32;
    }

    // Edge case: password with no recognized characters
    if (poolSize === 0) {
      return 0;
    }

    // Calculate entropy: H = L × log2(N)
    // where L = password length, N = character pool size
    const entropy = password.length * Math.log2(poolSize);

    return Math.floor(entropy);
  }

  /**
   * Get strength level description based on entropy
   *
   * Entropy levels (NIST guidelines):
   * - Very Weak: < 28 bits (crackable in seconds)
   * - Weak: 28-35 bits (crackable in minutes to hours)
   * - Reasonable: 36-59 bits (crackable in days to years)
   * - Strong: 60-127 bits (crackable in centuries)
   * - Very Strong: ≥ 128 bits (effectively uncrackable)
   *
   * @param entropy - Entropy in bits
   * @returns Human-readable strength level
   *
   * @example
   * PasswordEntropy.getLevel(14)  // 'Very Weak (< 28 bits)'
   * PasswordEntropy.getLevel(35)  // 'Weak (28-35 bits)'
   * PasswordEntropy.getLevel(85)  // 'Strong (60-127 bits)'
   */
  static getLevel(entropy: number): string {
    if (entropy < 28) {
      return 'Very Weak (< 28 bits)';
    }
    if (entropy < 36) {
      return 'Weak (28-35 bits)';
    }
    if (entropy < 60) {
      return 'Reasonable (36-59 bits)';
    }
    if (entropy < 128) {
      return 'Strong (60-127 bits)';
    }
    return 'Very Strong (≥ 128 bits)';
  }

  /**
   * Estimate time required to crack password
   *
   * Assumptions:
   * - Attacker has 1 billion attempts/second (modern GPU)
   * - No rate limiting or account lockout
   * - Brute force attack (trying all combinations)
   *
   * Formula:
   * Total combinations = 2^entropy
   * Time = combinations / 1,000,000,000 attempts/sec
   *
   * @param entropy - Entropy in bits
   * @returns Human-readable crack time estimate
   *
   * @example
   * PasswordEntropy.estimateCrackTime(14)  // 'instant (< 1 second)'
   * PasswordEntropy.estimateCrackTime(35)  // '17 seconds'
   * PasswordEntropy.estimateCrackTime(60)  // '36 years'
   * PasswordEntropy.estimateCrackTime(85)  // '1.2 million years'
   */
  // eslint-disable-next-line complexity -- Multiple time unit conversions required for human-readable output. Each condition represents a distinct time range (seconds, minutes, hours, days, years, millions of years, billions of years) to provide precise and understandable crack time estimates.
  static estimateCrackTime(entropy: number): string {
    if (entropy <= 0) {
      return 'instant (0 bits)';
    }

    // Calculate total number of possible combinations: 2^entropy
    const totalCombinations = Math.pow(2, entropy);

    // Assume 1 billion attempts per second (modern GPU capability)
    const attemptsPerSecond = 1e9;

    // Calculate time in seconds
    const seconds = totalCombinations / attemptsPerSecond;

    // Convert to human-readable format
    if (seconds < 1) {
      return 'instant (< 1 second)';
    }

    if (seconds < 60) {
      const roundedSeconds = Math.round(seconds);
      return `${roundedSeconds} second${roundedSeconds !== 1 ? 's' : ''}`;
    }

    const minutes = seconds / 60;
    if (minutes < 60) {
      const roundedMinutes = Math.round(minutes);
      return `${roundedMinutes} minute${roundedMinutes !== 1 ? 's' : ''}`;
    }

    const hours = minutes / 60;
    if (hours < 24) {
      const roundedHours = Math.round(hours);
      return `${roundedHours} hour${roundedHours !== 1 ? 's' : ''}`;
    }

    const days = hours / 24;
    if (days < 365) {
      const roundedDays = Math.round(days);
      return `${roundedDays} day${roundedDays !== 1 ? 's' : ''}`;
    }

    const years = days / 365.25;
    if (years < 1000000) {
      const roundedYears = Math.round(years);
      return `${roundedYears.toLocaleString()} year${roundedYears !== 1 ? 's' : ''}`;
    }

    const millions = years / 1000000;
    if (millions < 1000) {
      return `${millions.toFixed(1)} million years`;
    }

    const billions = millions / 1000;
    return `${billions.toFixed(1)} billion years`;
  }

  /**
   * Get comprehensive entropy analysis
   *
   * Convenience method that combines all three metrics:
   * - Entropy value (bits)
   * - Strength level
   * - Estimated crack time
   *
   * @param password - Password to analyze
   * @returns Object with all metrics
   *
   * @example
   * PasswordEntropy.analyze('Abc123!@#')
   * // {
   * //   entropy: 58,
   * //   level: 'Reasonable (36-59 bits)',
   * //   crackTime: '9 years'
   * // }
   */
  static analyze(password: string): {
    entropy: number;
    level: string;
    crackTime: string;
  } {
    const entropy = this.calculate(password);
    const level = this.getLevel(entropy);
    const crackTime = this.estimateCrackTime(entropy);

    return { entropy, level, crackTime };
  }
}
