const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

exports.generateAffiliationPDF = (data, res) => {
    const doc = new PDFDocument();

    // Pipe the PDF into the response
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('Ficha de Filiação - Sindicato de Professores', { align: 'center' });
    doc.moveDown();

    // Content
    doc.fontSize(12).text(`Nome: ${data.nome}`);
    doc.text(`CPF: ${data.cpf}`);
    doc.text(`RG: ${data.rg}`);
    doc.text(`Endereço: ${data.endereco}`);
    doc.text(`Escola: ${data.escola}`);
    doc.text(`Cargo: ${data.cargo}`);

    doc.moveDown();
    doc.text('Declaro que desejo me filiar ao sindicato e aceito os termos estatutários.', { align: 'justify' });

    doc.moveDown(2);
    doc.text('__________________________________________', { align: 'center' });
    doc.text('Assinatura do Professor', { align: 'center' });

    // Finalize the PDF and end the stream
    doc.end();
};
