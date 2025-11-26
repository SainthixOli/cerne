import React, { useEffect, useState } from 'react';
import { FileText, Download, Eye } from 'lucide-react';
import api from '../../api';

const ProfessorDocuments = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const response = await api.get('/documents/my');
                setDocuments(response.data);
            } catch (error) {
                console.error('Error fetching documents:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDocuments();
    }, []);

    const handleOpen = (url) => {
        if (url) {
            const filename = url.split('/').pop().split('\\').pop();
            window.open(`http://localhost:3000/api/documents/${filename}`, '_blank');
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Meus Documentos</h1>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Carregando documentos...</div>
                ) : documents.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">Nenhum documento encontrado.</div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {documents.map((doc) => (
                            <div key={doc.id} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900 dark:text-white">
                                            {doc.tipo_documento === 'ficha_assinada' ? 'Ficha de Filiação Assinada' : 'Documento'}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Enviado em {new Date(doc.data_upload).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleOpen(doc.url_arquivo)}
                                        className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition"
                                        title="Visualizar"
                                    >
                                        <Eye size={20} />
                                    </button>
                                    <button
                                        onClick={() => handleOpen(doc.url_arquivo)}
                                        className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition"
                                        title="Baixar"
                                    >
                                        <Download size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfessorDocuments;
