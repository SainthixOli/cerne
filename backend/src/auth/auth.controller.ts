import { Controller, Post, UseGuards, Request, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    // @UseGuards(AuthGuard('local'))
    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        // Manual validation via AuthService (handles CPF/Email flexibility)
        return this.authService.login(loginDto);
    }

    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    // Legacy Route (Frontend expects /api/register, Global Prefix handles /api, so we need path '../register' to escape 'auth' prefix?
    // Wait, Controller is 'auth'. So /api/auth/register.
    // Legacy was /api/register.
    // So we need: @Post('../register') to go to /api/register.
    @Post('../register')
    async registerLegacy(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }
}
