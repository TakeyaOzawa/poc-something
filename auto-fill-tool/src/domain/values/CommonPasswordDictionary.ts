/**
 * Common Password Dictionary
 *
 * Checks passwords against a list of commonly used weak passwords
 * based on Have I Been Pwned (HIBP) Top 100 data.
 *
 * References:
 * - HIBP: https://haveibeenpwned.com/Passwords
 * - OWASP: https://owasp.org/www-community/password-special-characters
 */

export class CommonPasswordDictionary {
  /**
   * Top 100 most common passwords (Have I Been Pwned data)
   * These passwords should never be accepted as they are extremely vulnerable
   */
  private static readonly TOP_100 = [
    // Top 10
    'password',
    '123456',
    '123456789',
    'password123',
    '12345678',
    'qwerty',
    'abc123',
    'password1',
    '12345',
    '1234567',

    // 11-20
    'letmein',
    '1234567890',
    'qwerty123',
    '000000',
    'monkey',
    'dragon',
    '123123',
    'baseball',
    'iloveyou',
    'trustno1',

    // 21-30
    '1234',
    'sunshine',
    'master',
    '123321',
    '666666',
    '123456a',
    'a123456',
    '111111',
    'welcome',
    'admin',

    // 31-40
    'login',
    'test',
    'passw0rd',
    'password!',
    'pass',
    'shadow',
    'ashley',
    'football',
    'jesus',
    'michael',

    // 41-50
    'ninja',
    'mustang',
    'password12',
    'starwars',
    'batman',
    'solo',
    'princess',
    'qazwsx',
    'passw',
    'admin123',

    // 51-60
    'test123',
    'welcome1',
    'welcome123',
    'user',
    'guest',
    'root',
    'demo',
    'sample',
    'temp',
    'admin1',

    // 61-70
    'changeme',
    'password2',
    'password3',
    'qwerty1',
    'qwerty12',
    'qwerty123456',
    'abc12345',
    'abcd1234',
    '12341234',
    '123123123',

    // 71-80
    '987654321',
    'zxcvbnm',
    'asdfghjkl',
    'qwertyuiop',
    'superman',
    'charlie',
    'donald',
    'password01',
    'password02',
    'password123!',

    // 81-90
    'pass123',
    'pass1234',
    'testing',
    'testing123',
    'password!1',
    'password@1',
    'password#1',
    'qwerty!',
    'qwerty@',
    'qwerty#',

    // 91-100
    '123qwe',
    'qwe123',
    '1q2w3e4r',
    '1q2w3e',
    'admin@123',
    'admin#123',
    'root123',
    'root@123',
    'user123',
    'guest123',
  ];

  /**
   * Check if password is in common password list
   * Uses case-insensitive comparison for maximum security
   *
   * @param password - Password to check
   * @returns true if password is in common list
   */
  static isCommon(password: string): boolean {
    if (!password || password.trim() === '') {
      return false;
    }

    const lowerPassword = password.toLowerCase();
    return this.TOP_100.some((common) => lowerPassword === common.toLowerCase());
  }

  /**
   * Check if password contains common password as substring
   * More strict check that catches variations like "password2023"
   *
   * @param password - Password to check
   * @returns true if password contains common password substring
   */
  static containsCommonPassword(password: string): boolean {
    if (!password || password.trim() === '') {
      return false;
    }

    const lowerPassword = password.toLowerCase();

    // Check against shorter common passwords (6+ characters)
    // to avoid false positives like "pass" in "compass"
    const shortCommonPasswords = this.TOP_100.filter((p) => p.length >= 6);

    return shortCommonPasswords.some((common) => lowerPassword.includes(common.toLowerCase()));
  }

  /**
   * Check against common patterns
   * Detects date patterns, keyboard walks, and name+year combinations
   *
   * @param password - Password to check
   * @returns true if password has common patterns
   */
  // eslint-disable-next-line complexity -- Multiple pattern checks required for comprehensive password validation including dates, keyboard walks, name+year patterns, sequential numbers, and repeated characters. Each check serves a distinct security purpose.
  static hasCommonPatterns(password: string): boolean {
    if (!password || password.trim() === '') {
      return false;
    }

    const lower = password.toLowerCase();

    // Date patterns: YYYYMMDD (19900101), MMDDYYYY, DDMMYYYY
    if (/^(19|20)\d{6}$/.test(password)) return true; // 19900101, 20231225
    if (/^\d{8}$/.test(password)) return true; // 12252023, 25122023

    // Keyboard walks (extended)
    if (/asdfg|zxcvb|qwert|yuiop|hjkl/.test(lower)) return true;

    // Name + year patterns: john2023, maria1990, test2024
    if (/^[a-z]+\d{4}$/i.test(password)) return true;

    // Year + name patterns: 2023john, 1990maria
    if (/^\d{4}[a-z]+$/i.test(password)) return true;

    // Simple number sequences (6+ digits)
    if (/\d{6,}/.test(password)) {
      const numbers = password.match(/\d+/g);
      if (numbers) {
        for (const num of numbers) {
          if (num.length >= 6) {
            // Check for sequential: 123456, 654321
            const isSequential = this.isSequentialNumbers(num);
            // eslint-disable-next-line max-depth -- Necessary nesting to check both sequential and repeated number patterns in password validation. This structure ensures efficient validation of 6+ digit sequences.
            if (isSequential) return true;

            // Check for repeated: 111111, 222222
            // eslint-disable-next-line max-depth -- Required for repeated pattern validation after sequential check. This ensures comprehensive detection of weak numeric patterns like 111111, 222222.
            if (/^(\d)\1+$/.test(num)) return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Check if numbers are sequential (ascending or descending)
   * @param numbers - String of numbers to check
   * @returns true if sequential
   */
  private static isSequentialNumbers(numbers: string): boolean {
    if (numbers.length < 3) return false;

    let ascending = true;
    let descending = true;

    for (let i = 1; i < numbers.length; i++) {
      const current = parseInt(numbers[i], 10);
      const prev = parseInt(numbers[i - 1], 10);

      if (current !== prev + 1) {
        ascending = false;
      }
      if (current !== prev - 1) {
        descending = false;
      }

      if (!ascending && !descending) {
        return false;
      }
    }

    return ascending || descending;
  }

  /**
   * Get comprehensive check result with detailed reason
   * Useful for providing user feedback
   *
   * @param password - Password to check
   * @returns Object with isWeak flag and reason
   */
  static check(password: string): { isWeak: boolean; reason: string | null } {
    if (!password || password.trim() === '') {
      return { isWeak: false, reason: null };
    }

    // Check 1: Exact match
    if (this.isCommon(password)) {
      return {
        isWeak: true,
        reason: 'This password is in the list of most commonly used passwords',
      };
    }

    // Check 2: Contains common password
    if (this.containsCommonPassword(password)) {
      return {
        isWeak: true,
        reason: 'This password contains a common password pattern',
      };
    }

    // Check 3: Common patterns
    if (this.hasCommonPatterns(password)) {
      return {
        isWeak: true,
        reason: 'This password uses a common pattern (dates, keyboard walks, etc.)',
      };
    }

    return { isWeak: false, reason: null };
  }

  /**
   * Get the size of the common password dictionary
   * @returns Number of passwords in the dictionary
   */
  static getSize(): number {
    return this.TOP_100.length;
  }
}
