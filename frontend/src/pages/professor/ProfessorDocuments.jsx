import React, { useEffect, useState } from 'react';
import { FileText, Download, Eye } from 'lucide-react';
import api from '../../api';

const ProfessorDocuments = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);

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

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!uploadFile) return;

        const data = new FormData();
        data.append('file', uploadFile);

        try {
            await api.post('/documents', data);
            setIsUploading(false);
            setUploadFile(null);
            fetchDocuments();
        } catch (error) {
            alert('Erro ao enviar documento');
        }
    };

    const handleOpen = (url) => {
        if (url) {
            const filename = url.split('/').pop().split('\\').pop();
            window.open(`http://localhost:3000/api/documents/${filename}`, '_blank');
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Meus Documentos</h1>
                <div className="flex space-x-3">
                    <button
                        onClick={() => setIsUploading(true)}
                        className="flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition shadow-md"
                    >
                        <FileText size={18} className="mr-2" />
                        Novo Documento
                    </button>
                    <button
                        onClick={() => window.open('http://localhost:3000/api/affiliations/certificate', '_blank')}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md"
                    >
                        <Download size={18} className="mr-2" />
                        Baixar Carteirinha
                    </button>
                </div>
            </div>

            {isUploading && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Enviar Documento</h3>
                        <form onSubmit={handleUpload}>
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 mb-6 hover:border-blue-500 transition cursor-pointer bg-gray-50 dark:bg-gray-700/30 text-center">
                                <input type="file" onChange={(e) => setUploadFile(e.target.files[0])} className="hidden" id="doc-upload" />
                                <label htmlFor="doc-upload" className="cursor-pointer flex flex-col items-center">
                                    <FileText size={40} className="text-gray-400 mb-2" />
                                    <span className="text-gray-600 dark:text-gray-300 font-medium">{uploadFile ? uploadFile.name : 'Selecionar Arquivo'}</span>
                                </label>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsUploading(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={!uploadFile}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    Enviar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
