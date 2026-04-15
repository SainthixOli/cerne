/**
 * Testes de Password Policy
 * Valida requisitos de força de senha
 */

const PasswordPolicy = require('../src/validations/passwordPolicy');

describe('Password Policy Validation', () => {
    describe('Valid Strong Passwords', () => {
        it('should accept password with all requirements', () => {
            const pwd = 'SecurePass123!';
            const result = PasswordPolicy.validate(pwd);

            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should accept very strong password', () => {
            const pwd = 'MySuper@Secure#Pass2026!';
            const result = PasswordPolicy.validate(pwd);

            expect(result.valid).toBe(true);
            expect(result.strength).toBeGreaterThan(80);
        });

        it('should accept password with multiple symbols', () => {
            const pwd = 'Test@Pass#2026!';
            const result = PasswordPolicy.validate(pwd);

            expect(result.valid).toBe(true);
        });
    });

    describe('Invalid Passwords - Too Short', () => {
        it('should reject password shorter than 12 chars', () => {
            const pwd = 'Short@1';
            const result = PasswordPolicy.validate(pwd);

            expect(result.valid).toBe(false);
            expect(result.errors[0]).toContain('12 caracteres');
        });

        it('should reject password with 11 chars', () => {
            const pwd = 'OnlyElevenC!';
            const result = PasswordPolicy.validate(pwd);

            expect(result.valid).toBe(false);
        });
    });

    describe('Invalid Passwords - Missing Uppercase', () => {
        it('should reject password without uppercase', () => {
            const pwd = 'lowercase@pass2026!';
            const result = PasswordPolicy.validate(pwd);

            expect(result.valid).toBe(false);
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.stringContaining('MAIÚSCULA')
                ])
            );
        });
    });

    describe('Invalid Passwords - Missing Lowercase', () => {
        it('should reject password without lowercase', () => {
            const pwd = 'UPPERCASE@PASS2026!';
            const result = PasswordPolicy.validate(pwd);

            expect(result.valid).toBe(false);
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.stringContaining('minúscula')
                ])
            );
        });
    });

    describe('Invalid Passwords - Missing Number', () => {
        it('should reject password without number', () => {
            const pwd = 'NoNumberPass@!';
            const result = PasswordPolicy.validate(pwd);

            expect(result.valid).toBe(false);
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.stringContaining('número')
                ])
            );
        });
    });

    describe('Invalid Passwords - Missing Symbol', () => {
        it('should reject password without symbol', () => {
            const pwd = 'NoSymbolPass2026';
            const result = PasswordPolicy.validate(pwd);

            expect(result.valid).toBe(false);
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.stringContaining('símbolo')
                ])
            );
        });
    });

    describe('Password Strength Calculation', () => {
        it('should rate good password as strong', () => {
            const pwd = 'Test@Pass123';
            const strength = PasswordPolicy.calculateStrength(pwd);

            expect(['Forte', 'Muito Forte']).toContain(
                PasswordPolicy.getStrengthLabel(pwd)
            );
        });

        it('should rate strong password as strong', () => {
            const pwd = 'VerySecure@Pass2026!Complex';
            const strength = PasswordPolicy.calculateStrength(pwd);

            expect(['Forte', 'Muito Forte']).toContain(
                PasswordPolicy.getStrengthLabel(pwd)
            );
        });

        it('should detect repeated characters as weak', () => {
            const pwd = 'Pass@2026!!!!!!';
            const strength = PasswordPolicy.calculateStrength(pwd);

            expect(strength).toBeLessThan(80);
        });

        it('should detect common words as weak', () => {
            const pwd = 'Password@123!';
            const strength = PasswordPolicy.calculateStrength(pwd);

            expect(strength).toBeLessThan(70);
        });
    });

    describe('Password Confirmation', () => {
        it('should match equal passwords', () => {
            const result = PasswordPolicy.validateConfirmation(
                'SecurePass@123',
                'SecurePass@123'
            );

            expect(result.valid).toBe(true);
        });

        it('should reject different passwords', () => {
            const result = PasswordPolicy.validateConfirmation(
                'SecurePass@123',
                'DifferentPass@123'
            );

            expect(result.valid).toBe(false);
            expect(result.error).toContain('não correspondem');
        });
    });

    describe('Edge Cases', () => {
        it('should reject null password', () => {
            const result = PasswordPolicy.validate(null);

            expect(result.valid).toBe(false);
        });

        it('should reject undefined password', () => {
            const result = PasswordPolicy.validate(undefined);

            expect(result.valid).toBe(false);
        });

        it('should reject empty password', () => {
            const result = PasswordPolicy.validate('');

            expect(result.valid).toBe(false);
        });

        it('should reject non-string password', () => {
            const result = PasswordPolicy.validate(12345);

            expect(result.valid).toBe(false);
        });
    });

    describe('Common Strong Passwords Examples', () => {
        const strongPasswords = [
            'MyBigPassword2026!@#',
            'Secure$Pass#Check2026',
            'LetMe!nYou@2026Test',
            'Complex@Password#123'
        ];

        strongPasswords.forEach(pwd => {
            it(`should accept: ${pwd.substring(0, 10)}...`, () => {
                const result = PasswordPolicy.validate(pwd);
                expect(result.valid).toBe(true);
            });
        });
    });

    describe('Common Weak Passwords Examples', () => {
        const weakPasswords = [
            'password123', // comum
            'Admin@1', // muito curta
            'Test@Pass', // sem número adequado
            'OnlyLetters'  // sem símbolo e número
        ];

        weakPasswords.forEach(pwd => {
            it(`should reject: ${pwd}`, () => {
                const result = PasswordPolicy.validate(pwd);
                expect(result.valid).toBe(false);
            });
        });
    });
});
