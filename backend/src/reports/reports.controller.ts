import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get()
    async getReports() {
        return this.reportsService.getDashboardStats();
    }
}
