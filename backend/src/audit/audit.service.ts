import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) { }

  async createLog(userId: string, action: string, resource: string, metadata?: any) {
    return this.prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  }

  async findAll() {
    return this.prisma.auditLog.findMany({
      include: { user: { select: { email: true } } },
      orderBy: { timestamp: 'desc' },
    });
  }
}
