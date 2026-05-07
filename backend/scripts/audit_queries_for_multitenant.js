#!/usr/bin/env node

/**
 * 🔍 QUERY AUDIT SCRIPT
 * Identifica todas as queries que precisam adicionar tenant_id
 * Gera relatório com criticidade e localização
 * 
 * Usage: node scripts/audit_queries_for_multitenant.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Padrões de queries a buscar
const QUERY_PATTERNS = [
    /db\.get\s*\(\s*['"`]SELECT/gi,
    /db\.all\s*\(\s*['"`]SELECT/gi,
    /db\.run\s*\(\s*['"`]INSERT/gi,
    /db\.run\s*\(\s*['"`]UPDATE/gi,
    /db\.run\s*\(\s*['"`]DELETE/gi,
    /knex\s*\(\s*['"`]\w+['"`]\s*\)\s*\.where/gi,
    /\.where\s*\(\s*['"`]\w+['"`]/gi,
];

// Tabelas que precisam de tenant_id
const TENANT_TABLES = [
    'profiles', 'filiacoes', 'documentos', 
    'conversations', 'messages', 'notifications',
    'filiation_chat', 'admin_evaluations', 
    'system_settings', 'audit_logs', 'security_alerts'
];

// Ignorar comentários e linhas
const IGNORE_PATTERNS = [
    /\/\//,           // Linhas comentadas
    /\/\*/,           // Blocos comentados
    /console\./,      // Console logs
];

class QueryAuditor {
    constructor() {
        this.results = [];
        this.totalQueries = 0;
        this.needsTenantId = 0;
    }

    /**
     * Verifica se a linha precisa de tenant_id
     */
    needsTenantIdCheck(line, fileName) {
        // Ignorar linhas comentadas
        if (IGNORE_PATTERNS.some(pattern => pattern.test(line))) {
            return false;
        }

        // Verificar se a query é sobre tabelas multi-tenant
        const hasTenantTable = TENANT_TABLES.some(table => {
            return new RegExp(`['"\`]${table}['"\`]|FROM\\s+${table}|INTO\\s+${table}`, 'i').test(line);
        });

        // Verificar se NÃO tem tenant_id ou tenant na query
        const hasTenantFilter = /tenant_id|tenantId|tenant_id\s*=/i.test(line);

        return hasTenantTable && !hasTenantFilter;
    }

    /**
     * Extrai contexto da query (próximas 3 linhas)
     */
    getContext(lines, index, contextSize = 3) {
        const start = Math.max(0, index - 1);
        const end = Math.min(lines.length, index + contextSize);
        return lines.slice(start, end).join('\n');
    }

    /**
     * Determina criticidade baseado no tipo de operação
     */
    determineCriticality(line) {
        if (/DELETE|DROP/i.test(line)) return 'CRÍTICA';
        if (/INSERT/i.test(line)) return 'ALTA';
        if (/UPDATE/i.test(line)) return 'ALTA';
        if (/SELECT/i.test(line)) return 'ALTA';
        return 'MÉDIA';
    }

    /**
     * Analisa um arquivo
     */
    analyzeFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            
            lines.forEach((line, index) => {
                if (this.needsTenantIdCheck(line, filePath)) {
                    this.needsTenantId++;
                    
                    // Extrair tipo de operação
                    let operation = 'UNKNOWN';
                    if (/SELECT/i.test(line)) operation = 'SELECT';
                    if (/INSERT/i.test(line)) operation = 'INSERT';
                    if (/UPDATE/i.test(line)) operation = 'UPDATE';
                    if (/DELETE/i.test(line)) operation = 'DELETE';

                    // Extrair tabela
                    const tableMatch = line.match(/(?:FROM|INTO|UPDATE)\s+['"`]?(\w+)['"`]?/i);
                    const table = tableMatch ? tableMatch[1] : 'UNKNOWN';

                    this.results.push({
                        file: filePath,
                        line: index + 1,
                        operation,
                        table,
                        criticality: this.determineCriticality(line),
                        code: line.trim().substring(0, 80),
                        context: this.getContext(lines, index)
                    });
                }
                
                // Contar total de queries
                if (QUERY_PATTERNS.some(pattern => pattern.test(line))) {
                    this.totalQueries++;
                }
            });
        } catch (error) {
            console.error(`❌ Erro ao ler ${filePath}:`, error.message);
        }
    }

    /**
     * Escaneia todos os arquivos
     */
    scan(baseDir) {
        const pattern = path.join(baseDir, 'backend/src/**/*.js');
        const files = glob.sync(pattern);
        
        console.log(`\n🔍 Escaneando ${files.length} arquivos...\n`);
        
        files.forEach(file => this.analyzeFile(file));
    }

    /**
     * Gera relatório
     */
    generateReport() {
        // Agrupar por arquivo
        const byFile = {};
        this.results.forEach(result => {
            if (!byFile[result.file]) {
                byFile[result.file] = [];
            }
            byFile[result.file].push(result);
        });

        // Agrupar por tabela
        const byTable = {};
        this.results.forEach(result => {
            if (!byTable[result.table]) {
                byTable[result.table] = [];
            }
            byTable[result.table].push(result);
        });

        // Contar por criticidade
        const byCriticality = {};
        this.results.forEach(result => {
            if (!byCriticality[result.criticality]) {
                byCriticality[result.criticality] = 0;
            }
            byCriticality[result.criticality]++;
        });

        return { byFile, byTable, byCriticality };
    }

    /**
     * Imprime relatório formatado
     */
    printReport() {
        const report = this.generateReport();
        
        console.log('\n' + '='.repeat(80));
        console.log('📊 AUDIT REPORT: QUERIES QUE PRECISAM DE tenant_id');
        console.log('='.repeat(80) + '\n');

        // Resumo
        console.log('📈 RESUMO:');
        console.log(`   Total de queries analisadas: ${this.totalQueries}`);
        console.log(`   Queries que precisam de tenant_id: ${this.needsTenantId}`);
        console.log(`   Percentual: ${((this.needsTenantId / this.totalQueries) * 100).toFixed(1)}%\n`);

        // Por criticidade
        console.log('🎯 POR CRITICIDADE:');
        Object.entries(report.byCriticality)
            .sort((a, b) => {
                const order = { 'CRÍTICA': 0, 'ALTA': 1, 'MÉDIA': 2 };
                return (order[a[0]] || 3) - (order[b[0]] || 3);
            })
            .forEach(([level, count]) => {
                const emoji = level === 'CRÍTICA' ? '🔴' : level === 'ALTA' ? '🟠' : '🟡';
                console.log(`   ${emoji} ${level}: ${count} queries`);
            });

        // Por tabela
        console.log('\n📋 POR TABELA:');
        Object.entries(report.byTable)
            .sort((a, b) => b[1].length - a[1].length)
            .forEach(([table, results]) => {
                console.log(`   ${table}: ${results.length} queries`);
            });

        // Por arquivo
        console.log('\n📁 POR ARQUIVO:');
        Object.entries(report.byFile)
            .sort((a, b) => b[1].length - a[1].length)
            .forEach(([file, results]) => {
                const shortPath = file.replace(/.*backend\/src\//, '');
                console.log(`   ${shortPath}: ${results.length} queries`);
            });

        console.log('\n' + '='.repeat(80) + '\n');
    }

    /**
     * Salva relatório em JSON
     */
    saveToJson(outputPath) {
        const report = this.generateReport();
        const output = {
            timestamp: new Date().toISOString(),
            summary: {
                total_queries_analyzed: this.totalQueries,
                queries_needing_tenant_id: this.needsTenantId,
                percentage: ((this.needsTenantId / this.totalQueries) * 100).toFixed(1)
            },
            by_criticality: report.byCriticality,
            by_table: Object.entries(report.byTable).reduce((acc, [table, results]) => {
                acc[table] = results.length;
                return acc;
            }, {}),
            by_file: Object.entries(report.byFile).reduce((acc, [file, results]) => {
                acc[file.replace(/.*backend\/src\//, '')] = results.length;
                return acc;
            }, {}),
            detailed_results: this.results.map(r => ({
                file: r.file.replace(/.*backend\/src\//, ''),
                line: r.line,
                operation: r.operation,
                table: r.table,
                criticality: r.criticality,
                preview: r.code
            }))
        };

        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
        console.log(`✅ Relatório salvo em: ${outputPath}\n`);
    }
}

// Executar
const auditor = new QueryAuditor();
const baseDir = process.cwd();

console.log('🚀 Iniciando auditoria de queries...\n');

auditor.scan(baseDir);
auditor.printReport();

// Salvar JSON
const reportPath = path.join(baseDir, 'docs', 'QUERY_AUDIT_REPORT.json');
auditor.saveToJson(reportPath);

console.log('✅ Auditoria concluída!\n');
console.log('📌 Próximos passos:');
console.log('   1. Revisar docs/QUERY_AUDIT_REPORT.json');
console.log('   2. Priorizar queries CRÍTICAS');
console.log('   3. Começar modificações em affiliationController.js\n');
