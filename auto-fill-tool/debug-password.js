// Quick debug script to check password strength feedback
const { PasswordStrength } = require('./dist/domain/values/PasswordStrength');

const passwords = [
  'Pass12345',
  'qwertyABC!',
  'Passssss1!',
  'password1',
  'Pass123',
  'qwertyA1!',
];

console.log('Testing password strength feedback:\n');
passwords.forEach(pwd => {
  const strength = PasswordStrength.calculate(pwd);
  console.log(`Password: "${pwd}"`);
  console.log(`  Score: ${strength.score}, Level: ${strength.level}`);
  console.log(`  Feedback: ${JSON.stringify(strength.feedback)}`);
  console.log(`  Has "common patterns": ${strength.feedback.some(f => f.includes('common patterns'))}`);
  console.log('');
});
