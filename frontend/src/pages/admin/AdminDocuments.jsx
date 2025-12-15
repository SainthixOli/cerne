import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../../api';

const AdminDocuments = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('document', file);
        formData.append('type', 'template_contrato'); // Fixed type for the template

        setUploading(true);
        try {
            await api.post('/documents/template', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Modelo de contrato atualizado com sucesso!');
            setFile(null);
        } catch (error) {
            console.error(error);
            alert('Erro ao enviar modelo.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Gestão de Documentos</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie os modelos de documentos do sistema.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                <div className="flex items-start space-x-6">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        <FileText size={40} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Modelo de Contrato de Adesão</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Este é o documento padrão que será disponibilizado para os novos membros baixarem e assinarem.
                            Ao enviar um novo arquivo, o anterior será substituído automaticamente.
                        </p>

                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-500 transition-colors bg-gray-50 dark:bg-gray-800/50">
                            <input
                                type="file"
                                id="template-upload"
                                className="hidden"
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx"
                            />
                            <label htmlFor="template-upload" className="cursor-pointer flex flex-col items-center">
                                <Upload size={32} className="text-gray-400 mb-3" />
                                <span className="text-gray-700 dark:text-gray-300 font-medium">
                                    {file ? file.name : 'Clique para selecionar o arquivo'}
                                </span>
                                <span className="text-sm text-gray-400 mt-1">PDF, DOC ou DOCX (Max 10MB)</span>
                            </label>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={handleUpload}
                                disabled={!file || uploading}
                                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                                {uploading ? 'Enviando...' : (
                                    <>
                                        <CheckCircle size={18} className="mr-2" /> Atualizar Modelo
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDocuments;
