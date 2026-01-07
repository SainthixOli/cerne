import { Controller, Get, UseGuards, Post, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

@Controller('system')
@UseGuards(AuthGuard('jwt'))
export class SystemController {
    constructor(private prisma: PrismaService) { }

    @Get('stats')
    async getStats() {
        const dbPath = path.resolve(__dirname, '../../../prisma/dev.db');
        let dbSizeMB = '0.00';
        if (fs.existsSync(dbPath)) {
            const stats = fs.statSync(dbPath);
            dbSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        }

        const memoryUsage = process.memoryUsage();
        const memoryUsageMB = (memoryUsage.rss / (1024 * 1024)).toFixed(2);

        const cpus = os.cpus().length;
        const loadAvg = os.loadavg()[0];
        const cpuLoadPercent = Math.min(100, (loadAvg / cpus) * 100).toFixed(1);

        const userCount = await this.prisma.user.count();
        const affiliationCount = await this.prisma.affiliation.count();
        const documentCount = await this.prisma.document.count();

        return {
            storage: {
                database: `${dbSizeMB} MB`,
                // Mock uploads size for now or implement folder walk
                uploads: '0.00 MB',
                total: `${dbSizeMB} MB`
            },
            performance: {
                memory: `${memoryUsageMB} MB`,
                uptime: `${(process.uptime() / 60).toFixed(2)} minutes`,
                cpuLoad: `${cpuLoadPercent}%`
            },
            counts: {
                users: userCount,
                affiliations: affiliationCount,
                documents: documentCount
            }
        };
    }

    @Post('console')
    async executeCommand(@Body() body: { command: string }) {
        // Basic unsafe console mock for demo purposes
        return { output: `Mock output for command: ${body.command}` };
    }
}
