const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const { getDb } = require('../config/database');

exports.generateAffiliationPDF = async (data, res) => {
    const doc = new PDFDocument();
    const db = await getDb();

    // Fetch dynamic terms
    let terms = 'Eu, {{NOME}}, solicito minha filiação.'; // Fallback
    try {
        const setting = await db.get("SELECT value FROM system_settings WHERE key = 'affiliation_terms'");
        if (setting) terms = setting.value;
    } catch (err) {
        console.error("Error fetching terms:", err);
    }

    // Replace placeholders - Complete List
    // Fix potential literal "\n" strings from DB
    const sanitizedTerms = terms.replace(/\\n/g, '\n');

    const dynamicText = sanitizedTerms
        .replace(/{{NOME}}/g, data.nome_completo || data.nome) // Handle both naming conventions
        .replace(/{{CPF}}/g, data.cpf)
        .replace(/{{EMAIL}}/g, data.email || '')
        .replace(/{{MATRICULA}}/g, data.matricula || data.matricula_funcional || '__________')
        .replace(/{{TELEFONE}}/g, data.telefone || '')
        .replace(/{{RG}}/g, data.rg || '__________')
        .replace(/{{ORGAO_EMISSOR}}/g, data.orgao_emissor || '')
        .replace(/{{NACIONALIDADE}}/g, data.nacionalidade || '')
        .replace(/{{ESTADO_CIVIL}}/g, data.estado_civil || '')
        .replace(/{{ENDERECO}}/g, `${data.endereco || ''}, ${data.numero || ''} ${data.complemento ? '- ' + data.complemento : ''}`)
        .replace(/{{BAIRRO}}/g, data.bairro || '')
        .replace(/{{CIDADE}}/g, data.cidade || '')
        .replace(/{{UF}}/g, data.uf || '')
        .replace(/{{CEP}}/g, data.cep || '')
        .replace(/{{DATA}}/g, new Date().toLocaleDateString('pt-BR'));

    // Pipe the PDF into the response
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('Ficha de Cadastro', { align: 'center' });
    doc.moveDown();

    // Personal Data Block
    doc.fontSize(12).font('Helvetica-Bold').text('Dados do Solicitante:');
    doc.font('Helvetica').text(`Nome: ${data.nome_completo}`);
    doc.text(`CPF: ${data.cpf}`);
    doc.text(`Email: ${data.email}`);
    doc.text(`Telefone: ${data.telefone}`);
    doc.text(`Matrícula: ${data.matricula || 'N/A'}`);

    doc.moveDown();

    // Dynamic Terms
    doc.fontSize(12).text(dynamicText, { align: 'justify' });

    doc.moveDown(4);
    doc.text('__________________________________________', { align: 'center' });
    doc.text('Assinatura do Solicitante', { align: 'center' });

    // Gov.br Info
    doc.moveDown(2);
    doc.fontSize(10).fillColor('grey').text('Este documento deve ser assinado digitalmente (Gov.br) ou fisicamente e enviado para aprovação.', { align: 'center' });

    // Finalize the PDF and end the stream
    doc.end();
};

exports.generateCertificate = (user, res) => {
    const doc = new PDFDocument({
        layout: 'landscape',
        size: [400, 250] // Card size
    });

    doc.pipe(res);

    // Background or Border (Simple rect)
    doc.rect(10, 10, 380, 230).stroke();

    // Header
    doc.fontSize(16).font('Helvetica-Bold').text('EMPRESA X - Carteira de Membro', 20, 30, { align: 'center', width: 360 });

    // Content
    doc.fontSize(12).font('Helvetica').text(`Nome: ${user.nome_completo}`, 30, 80);
    doc.text(`CPF: ${user.cpf}`, 30, 100);
    doc.text(`Matrícula: ${user.matricula_funcional || 'N/A'}`, 30, 120);
    doc.text(`Validade: Indeterminada`, 30, 140);

    // Footer
    doc.fontSize(10).text('Este documento comprova a filiação ao CERNE System.', 20, 200, { align: 'center', width: 360 });

    doc.end();
};
