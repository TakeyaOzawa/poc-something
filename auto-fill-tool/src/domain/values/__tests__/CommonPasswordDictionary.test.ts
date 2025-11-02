/**
 * CommonPasswordDictionary Tests
 *
 * Comprehensive test suite for common password dictionary validation
 * Covers Top 100 passwords, pattern detection, and edge cases
 */

import { CommonPasswordDictionary } from '../CommonPasswordDictionary';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('CommonPasswordDictionary', () => {
  describe('getSize()', () => {
    it('should return 100 passwords in dictionary', () => {
      expect(CommonPasswordDictionary.getSize()).toBe(100);
    });
  });

  describe('isCommon() - Exact Match Tests', () => {
    describe('Top 10 passwords', () => {
      const top10 = [
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
      ];

      top10.forEach((password) => {
        it(`should detect "${password}" as common`, () => {
          expect(CommonPasswordDictionary.isCommon(password)).toBe(true);
        });
      });
    });

    describe('Passwords 11-20', () => {
      const passwords = [
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
      ];

      passwords.forEach((password) => {
        it(`should detect "${password}" as common`, () => {
          expect(CommonPasswordDictionary.isCommon(password)).toBe(true);
        });
      });
    });

    describe('Passwords 21-30', () => {
      const passwords = [
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
      ];

      passwords.forEach((password) => {
        it(`should detect "${password}" as common`, () => {
          expect(CommonPasswordDictionary.isCommon(password)).toBe(true);
        });
      });
    });

    describe('Passwords 31-40', () => {
      const passwords = [
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
      ];

      passwords.forEach((password) => {
        it(`should detect "${password}" as common`, () => {
          expect(CommonPasswordDictionary.isCommon(password)).toBe(true);
        });
      });
    });

    describe('Passwords 41-50', () => {
      const passwords = [
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
      ];

      passwords.forEach((password) => {
        it(`should detect "${password}" as common`, () => {
          expect(CommonPasswordDictionary.isCommon(password)).toBe(true);
        });
      });
    });

    describe('Passwords 51-60', () => {
      const passwords = [
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
      ];

      passwords.forEach((password) => {
        it(`should detect "${password}" as common`, () => {
          expect(CommonPasswordDictionary.isCommon(password)).toBe(true);
        });
      });
    });

    describe('Passwords 61-70', () => {
      const passwords = [
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
      ];

      passwords.forEach((password) => {
        it(`should detect "${password}" as common`, () => {
          expect(CommonPasswordDictionary.isCommon(password)).toBe(true);
        });
      });
    });

    describe('Passwords 71-80', () => {
      const passwords = [
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
      ];

      passwords.forEach((password) => {
        it(`should detect "${password}" as common`, () => {
          expect(CommonPasswordDictionary.isCommon(password)).toBe(true);
        });
      });
    });

    describe('Passwords 81-90', () => {
      const passwords = [
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
      ];

      passwords.forEach((password) => {
        it(`should detect "${password}" as common`, () => {
          expect(CommonPasswordDictionary.isCommon(password)).toBe(true);
        });
      });
    });

    describe('Passwords 91-100', () => {
      const passwords = [
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

      passwords.forEach((password) => {
        it(`should detect "${password}" as common`, () => {
          expect(CommonPasswordDictionary.isCommon(password)).toBe(true);
        });
      });
    });

    describe('Case insensitive matching', () => {
      it('should detect uppercase PASSWORD', () => {
        expect(CommonPasswordDictionary.isCommon('PASSWORD')).toBe(true);
      });

      it('should detect mixed case PaSsWoRd', () => {
        expect(CommonPasswordDictionary.isCommon('PaSsWoRd')).toBe(true);
      });

      it('should detect QWERTY', () => {
        expect(CommonPasswordDictionary.isCommon('QWERTY')).toBe(true);
      });
    });

    describe('Non-common passwords', () => {
      it('should not detect strong random password', () => {
        expect(CommonPasswordDictionary.isCommon('X9$mK2@pL5vQ8#nR')).toBe(false);
      });

      it('should not detect long passphrase', () => {
        expect(CommonPasswordDictionary.isCommon('correct horse battery staple')).toBe(false);
      });
    });

    describe('Edge cases', () => {
      it('should return false for empty string', () => {
        expect(CommonPasswordDictionary.isCommon('')).toBe(false);
      });

      it('should return false for whitespace only', () => {
        expect(CommonPasswordDictionary.isCommon('   ')).toBe(false);
      });
    });
  });

  describe('containsCommonPassword() - Substring Match Tests', () => {
    it('should detect password2023 (contains password)', () => {
      expect(CommonPasswordDictionary.containsCommonPassword('password2023')).toBe(true);
    });

    it('should detect mypassword (contains password)', () => {
      expect(CommonPasswordDictionary.containsCommonPassword('mypassword')).toBe(true);
    });

    it('should detect qwerty999 (contains qwerty)', () => {
      expect(CommonPasswordDictionary.containsCommonPassword('qwerty999')).toBe(true);
    });

    it('should not detect admin@company (admin is < 6 chars)', () => {
      expect(CommonPasswordDictionary.containsCommonPassword('admin@company')).toBe(false);
    });

    it('should not detect compass (contains pass but < 6 chars)', () => {
      expect(CommonPasswordDictionary.containsCommonPassword('compass')).toBe(false);
    });

    it('should not detect passage (contains pass but < 6 chars)', () => {
      expect(CommonPasswordDictionary.containsCommonPassword('passage')).toBe(false);
    });

    it('should detect password variations with numbers', () => {
      expect(CommonPasswordDictionary.containsCommonPassword('123456abc')).toBe(true);
    });

    it('should detect welcome with suffix', () => {
      expect(CommonPasswordDictionary.containsCommonPassword('welcome2024')).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(CommonPasswordDictionary.containsCommonPassword('')).toBe(false);
    });

    it('should return false for whitespace only', () => {
      expect(CommonPasswordDictionary.containsCommonPassword('   ')).toBe(false);
    });
  });

  describe('hasCommonPatterns() - Pattern Detection Tests', () => {
    describe('Date patterns', () => {
      it('should detect YYYYMMDD pattern: 19900101', () => {
        expect(CommonPasswordDictionary.hasCommonPatterns('19900101')).toBe(true);
      });

      it('should detect YYYYMMDD pattern: 20231225', () => {
        expect(CommonPasswordDictionary.hasCommonPatterns('20231225')).toBe(true);
      });

      it('should detect 8-digit date: 12252023', () => {
        expect(CommonPasswordDictionary.hasCommonPatterns('12252023')).toBe(true);
      });

      it('should detect 8-digit date: 25122023', () => {
        expect(CommonPasswordDictionary.hasCommonPatterns('25122023')).toBe(true);
      });

      it('should detect any 8-digit pattern: 18001231', () => {
        expect(CommonPasswordDictionary.hasCommonPatterns('18001231')).toBe(true);
      });

      it('should detect any 8-digit pattern: 21001231', () => {
        expect(CommonPasswordDictionary.hasCommonPatterns('21001231')).toBe(true);
      });
    });

    describe('Keyboard walk patterns', () => {
      it('should detect asdfg', () => {
        expect(CommonPasswordDictionary.hasCommonPatterns('asdfg')).toBe(true);
      });

      it('should detect zxcvb', () => {
        expect(CommonPasswordDictionary.hasCommonPatterns('zxcvb')).toBe(true);
      });

      it('should detect qwert', () => {
        expect(CommonPasswordDictionary.hasCommonPatterns('qwert')).toBe(true);
      });

      it('should detect yuiop', () => {
        expect(CommonPasswordDictionary.hasCommonPatterns('yuiop')).toBe(true);
      });

      it('should detect hjkl', () => {
        expect(CommonPasswordDictionary.hasCommonPatterns('hjkl')).toBe(true);
      });

      it('should detect keyboard walk in longer password', () => {
        expect(CommonPasswordDictionary.hasCommonPatterns('myasdfgpassword')).toBe(true);
      });
    });

    describe('Name + year patterns', () => {
      it('should detect john2023', () => {
        expect(CommonPasswordDictionary.hasCommonPatterns('john2023')).toBe(true);
      });

      it('should detect maria1990', () => {
        expect(CommonPasswordDictionary.hasCommonPatterns('maria1990')).toBe(true);
      });

      it('should detect test2024', () => {
        expect(CommonPasswordDictionary.hasCommonPatterns('test2024')).toBe(true);
      });

      it('should detect alice1985', () => {
        expect(CommonPasswordDictionary.hasCommonPatterns('alice1985')).toBe(true);
      });
    });

    describe('Year + name patterns', () => {
      it('should detect 2023john', () => {
        expect(CommonPasswordDictionary.hasCommonPatterns('2023john')).toBe(true);
      });

      it('should detect 1990maria', () => {
        expect(CommonPasswordDictionary.hasCommonPatterns('1990maria')).toBe(true);
      });

      it('should detect 2024test', () => {
        expect(CommonPasswordDictionary.hasCommonPatterns('2024test')).toBe(true);
      });
    });

    describe('Sequential numbers (6+ digits)', () => {
      it('should detect 123456', () => {
        expect(CommonPasswordDictionary.hasCommonPatterns('123456')).toBe(true);
      });

      it('should detect 234567', () => {
        expect(CommonPasswordDictionary.hasCommonPatterns('234567')).toBe(true);
      });

      it('should detect 654321 (descending)', () => {
        expect(CommonPasswordDictionary.hasCommonPatterns('654321')).toBe(true);
      });

      it('should detect 987654 (descending)', () => {
        expect(CommonPasswordDictionary.hasCommonPatterns('987654')).toBe(true);
      });

      it('should detect sequential in longer password', () => {
        expect(CommonPasswordDictionary.hasCommonPatterns('pass123456word')).toBe(true);
      });

      it('should not detect non-sequential 6 digits', () => {
        expect(CommonPasswordDictionary.hasCommonPatterns('159263')).toBe(false);
      });
    });

    describe('Repeated numbers (6+ digits)', () => {
      it('should detect 111111', () => {
        expect(CommonPasswordDictionary.hasCommonPatterns('111111')).toBe(true);
      });

      it('should detect 222222', () => {
        expect(CommonPasswordDictionary.hasCommonPatterns('222222')).toBe(true);
      });

      it('should detect 999999', () => {
        expect(CommonPasswordDictionary.hasCommonPatterns('999999')).toBe(true);
      });

      it('should detect repeated in longer password', () => {
        expect(CommonPasswordDictionary.hasCommonPatterns('pass111111')).toBe(true);
      });
    });

    describe('Edge cases', () => {
      it('should return false for empty string', () => {
        expect(CommonPasswordDictionary.hasCommonPatterns('')).toBe(false);
      });

      it('should return false for whitespace only', () => {
        expect(CommonPasswordDictionary.hasCommonPatterns('   ')).toBe(false);
      });

      it('should not detect 5-digit sequences', () => {
        expect(CommonPasswordDictionary.hasCommonPatterns('12345')).toBe(false);
      });

      it('should not detect strong random patterns', () => {
        expect(CommonPasswordDictionary.hasCommonPatterns('X9$mK2@pL5vQ8#nR')).toBe(false);
      });
    });
  });

  describe('check() - Comprehensive Validation', () => {
    describe('Exact match detection', () => {
      it('should return isWeak=true with reason for password', () => {
        const result = CommonPasswordDictionary.check('password');
        expect(result.isWeak).toBe(true);
        expect(result.reason).toBe('This password is in the list of most commonly used passwords');
      });

      it('should return isWeak=true with reason for admin', () => {
        const result = CommonPasswordDictionary.check('admin');
        expect(result.isWeak).toBe(true);
        expect(result.reason).toBe('This password is in the list of most commonly used passwords');
      });
    });

    describe('Substring match detection', () => {
      it('should return isWeak=true with reason for password2023', () => {
        const result = CommonPasswordDictionary.check('password2023');
        expect(result.isWeak).toBe(true);
        expect(result.reason).toBe('This password contains a common password pattern');
      });

      it('should return isWeak=true with reason for myqwerty', () => {
        const result = CommonPasswordDictionary.check('myqwerty');
        expect(result.isWeak).toBe(true);
        expect(result.reason).toBe('This password contains a common password pattern');
      });
    });

    describe('Pattern detection', () => {
      it('should return isWeak=true with reason for 19900101', () => {
        const result = CommonPasswordDictionary.check('19900101');
        expect(result.isWeak).toBe(true);
        expect(result.reason).toBe(
          'This password uses a common pattern (dates, keyboard walks, etc.)'
        );
      });

      it('should return isWeak=true with reason for john2023', () => {
        const result = CommonPasswordDictionary.check('john2023');
        expect(result.isWeak).toBe(true);
        expect(result.reason).toBe(
          'This password uses a common pattern (dates, keyboard walks, etc.)'
        );
      });

      it('should return isWeak=true with reason for asdfg123', () => {
        const result = CommonPasswordDictionary.check('asdfg123');
        expect(result.isWeak).toBe(true);
        expect(result.reason).toBe(
          'This password uses a common pattern (dates, keyboard walks, etc.)'
        );
      });
    });

    describe('Strong passwords', () => {
      it('should return isWeak=false for strong random password', () => {
        const result = CommonPasswordDictionary.check('X9$mK2@pL5vQ8#nR');
        expect(result.isWeak).toBe(false);
        expect(result.reason).toBeNull();
      });

      it('should return isWeak=false for long passphrase', () => {
        const result = CommonPasswordDictionary.check('correct horse battery staple');
        expect(result.isWeak).toBe(false);
        expect(result.reason).toBeNull();
      });

      it('should return isWeak=false for complex password', () => {
        const result = CommonPasswordDictionary.check('K7!rT$9mP@2nQ#8');
        expect(result.isWeak).toBe(false);
        expect(result.reason).toBeNull();
      });
    });

    describe('Edge cases', () => {
      it('should return isWeak=false for empty string', () => {
        const result = CommonPasswordDictionary.check('');
        expect(result.isWeak).toBe(false);
        expect(result.reason).toBeNull();
      });

      it('should return isWeak=false for whitespace only', () => {
        const result = CommonPasswordDictionary.check('   ');
        expect(result.isWeak).toBe(false);
        expect(result.reason).toBeNull();
      });
    });
  });
});
