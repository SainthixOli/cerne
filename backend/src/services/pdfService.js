const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

exports.generateAffiliationPDF = (data, res) => {
    const doc = new PDFDocument();

    // Pipe the PDF into the response
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('Ficha de Cadastro - Empresa X', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Nome: ${data.nome_completo}`); // Assuming data now contains nome_completo
    doc.text(`CPF: ${data.cpf}`);
    doc.text(`Email: ${data.email}`); // Assuming data now contains email
    doc.text(`Cargo: ${data.cargo}`); // Keeping cargo as it was in the original context

    doc.moveDown(4);
    doc.text('__________________________________________', { align: 'center' });
    doc.text('Assinatura do Professor', { align: 'center' });

    // Finalize the PDF and end the stream
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
    doc.fontSize(10).text('Este documento comprova a filiação ao Sindicato.', 20, 200, { align: 'center', width: 360 });

    doc.end();
};
