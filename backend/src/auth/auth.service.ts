import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async validateUser(identifier: string, pass: string): Promise<any> {
        // 1. Try to find by Email
        let user = await this.prisma.user.findUnique({ where: { email: identifier } });

        // 2. If not found, try to find by CPF in Profile
        if (!user) {
            const profile = await this.prisma.profile.findUnique({
                where: { cpf: identifier },
                include: { user: true }
            });
            if (profile) {
                user = profile.user;
            }
        }

        if (user && (await bcrypt.compare(pass, user.password))) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(loginDto: LoginDto) {
        const identifier = loginDto.cpf || loginDto.email;
        console.log('Login attempt:', { identifier, cpf: loginDto.cpf, email: loginDto.email });

        if (!identifier) {
            throw new UnauthorizedException('Email or CPF is required');
        }
        const user = await this.validateUser(identifier, loginDto.password);
        if (!user) {
            console.log('User not found or invalid password for', identifier);
            throw new UnauthorizedException('Invalid credentials');
        }
        const payload = { email: user.email, sub: user.id, role: user.role };
        return {
            token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
                changePasswordRequired: false // Standard default for now
            }
        };
    }

    async register(registerDto: RegisterDto) {
        const hashedPassword = await bcrypt.hash(registerDto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                email: registerDto.email,
                password: hashedPassword,
                name: registerDto.name,
                role: 'user',
                profile: {
                    create: {
                        cpf: registerDto.cpf
                    }
                }
            },
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...result } = user;
        return result;
    }
}
