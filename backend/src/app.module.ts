import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AffiliationsModule } from './affiliations/affiliations.module';
import { DocumentsModule } from './documents/documents.module';
import { SystemController } from './system/system.controller';
import { AuditModule } from './audit/audit.module';

import { PrismaModule } from './prisma/prisma.module';

import { ReportsModule } from './reports/reports.module';

import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule, AuthModule, UsersModule, AffiliationsModule, DocumentsModule, AuditModule, ReportsModule
  ],
  controllers: [AppController, SystemController],
  providers: [AppService],
})
export class AppModule { }
