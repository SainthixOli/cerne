import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
    });
    return result;
  }

  async findAll() {
    return this.prisma.user.findMany({ select: { id: true, name: true, email: true, role: true } });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
    if (!user) return null;

    // Map to Legacy Frontend format
    return {
      id: user.id,
      nome_completo: user.name,
      email: user.email,
      role: user.role,
      // Flatten Profile
      ...user.profile,
      telefone: user.profile?.phone || '',
      matricula_funcional: user.profile?.matricula || '',
      photo_url: '', // Schema does not have photoUrl yet
      // Add other legacy fields if needed
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
    return result;
  }

  async remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
