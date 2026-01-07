import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ example: 'user@example.com', description: 'User email address', required: false })
    @IsOptional()
    @IsString()
    email?: string;

    @ApiProperty({ example: '123.456.789-00', description: 'User CPF', required: false })
    @IsOptional()
    @IsString()
    cpf?: string;

    @ApiProperty({ example: 'password123', description: 'User password (min 6 chars)' })
    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    password: string;
}
