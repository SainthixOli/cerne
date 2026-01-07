import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({ example: 'John Doe', description: 'Full name' })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ example: 'user@example.com', description: 'Email address' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'secretPass', description: 'Password (min 6 chars)' })
    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({ example: '12345678900', description: 'CPF number' })
    @IsNotEmpty()
    @IsString()
    cpf: string;
}
