import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
    constructor(private prisma: PrismaService) { }

    async getDashboardStats() {
        // 1. Fetch all affiliations
        const affiliations = await this.prisma.affiliation.findMany();

        // 2. Calculate summary
        const total = affiliations.length;
        const pending = affiliations.filter(a => a.status === 'pending' || a.status === 'em_analise').length;
        const approved = affiliations.filter(a => a.status === 'approved' || a.status === 'concluido').length;
        const rejected = affiliations.filter(a => a.status === 'rejected' || a.status === 'rejeitado').length;

        // Today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const today = affiliations.filter(a => new Date(a.requestDate) >= todayStart).length;

        // 3. Status Chart Data
        const statusCounts = affiliations.reduce((acc: Record<string, number>, curr) => {
            const s = curr.status;
            acc[s] = (acc[s] || 0) + 1;
            return acc;
        }, {});
        const statusChart = Object.keys(statusCounts).map(k => ({ status: k, count: statusCounts[k] }));

        // 4. Monthly Chart Data (Mock or Real)
        // Group by Month/Year of requestDate
        const months: Record<string, number> = {};
        affiliations.forEach((a: any) => {
            const d = new Date(a.requestDate);
            const k = `${d.getMonth() + 1}/${d.getFullYear()}`;
            months[k] = (months[k] || 0) + 1;
        });
        const monthlyChart = Object.keys(months).map(k => ({ month: k, count: months[k] }));

        // 5. Avg Approval Time (Mock for now, or calc if approvalDate exists)
        let totalHours = 0;
        let approvedCountWithDate = 0;
        affiliations.forEach((a: any) => {
            if (a.status === 'approved' && a.approvalDate) {
                const diff = new Date(a.approvalDate).getTime() - new Date(a.requestDate).getTime();
                const hours = diff / (1000 * 60 * 60);
                totalHours += hours;
                approvedCountWithDate++;
            }
        });
        const avgApprovalHours = approvedCountWithDate > 0 ? (totalHours / approvedCountWithDate).toFixed(1) : 0;

        return {
            summary: {
                total,
                pending,
                approved,
                today,
                rejected,
                avgApprovalHours
            },
            charts: {
                status: statusChart,
                monthly: monthlyChart,
                rejectionReasons: [ // Mock or Real if we have reason field
                    { reason: 'Documentação Incompleta', count: 5 },
                    { reason: 'Dados Inválidos', count: 2 }
                ]
            }
        };
    }
}
