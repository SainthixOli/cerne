import React, { useEffect, useState } from 'react';
import { FileText, Download, Eye, UploadCloud, X, File } from 'lucide-react';
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
        <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Meus Documentos</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie seus arquivos e comprovantes.</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => setIsUploading(true)}
                        className="glass px-4 py-2.5 rounded-xl flex items-center hover:bg-white/20 transition group"
                    >
                        <UploadCloud size={18} className="mr-2 text-blue-500 group-hover:scale-110 transition-transform" />
                        <span className="font-medium text-gray-700 dark:text-gray-200">Novo Documento</span>
                    </button>
                    <button
                        onClick={() => window.open('http://localhost:3000/api/affiliations/certificate', '_blank')}
                        className="btn-primary flex items-center px-6 py-2.5"
                    >
                        <Download size={18} className="mr-2" />
                        Baixar Carteirinha
                    </button>
                </div>
            </div>

            {isUploading && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="glass-panel p-8 max-w-md w-full shadow-2xl relative">
                        <button
                            onClick={() => setIsUploading(false)}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition"
                        >
                            <X size={20} />
                        </button>

                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                            <UploadCloud className="mr-3 text-blue-500" />
                            Enviar Documento
                        </h3>

                        <form onSubmit={handleUpload}>
                            <div className="border-2 border-dashed border-gray-300 dark:border-white/20 rounded-2xl p-8 mb-6 hover:border-blue-500 dark:hover:border-blue-500 transition cursor-pointer bg-gray-50/50 dark:bg-white/5 text-center group">
                                <input type="file" onChange={(e) => setUploadFile(e.target.files[0])} className="hidden" id="doc-upload" />
                                <label htmlFor="doc-upload" className="cursor-pointer flex flex-col items-center w-full h-full">
                                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <FileText size={32} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <span className="text-gray-900 dark:text-white font-medium text-lg mb-1">{uploadFile ? uploadFile.name : 'Clique para selecionar'}</span>
                                    <span className="text-gray-500 dark:text-gray-400 text-sm">PDF, JPG ou PNG (Max 5MB)</span>
                                </label>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsUploading(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={!uploadFile}
                                    className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Enviar Arquivo
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="glass-panel overflow-hidden">
                {loading ? (
                    <div className="p-12 flex flex-col items-center justify-center text-gray-500">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p>Carregando documentos...</p>
                    </div>
                ) : documents.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FileText size={40} className="text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Nenhum documento</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                            Você ainda não enviou nenhum documento. Use o botão acima para começar.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-white/5">
                        {documents.map((doc) => (
                            <div key={doc.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-white/5 transition duration-200 group">
                                <div className="flex items-center space-x-5">
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                        <File size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">
                                            {doc.tipo_documento === 'ficha_assinada' ? 'Ficha de Filiação Assinada' : 'Documento'}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                                            Enviado em {new Date(doc.data_upload).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleOpen(doc.url_arquivo)}
                                        className="p-2.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                                        title="Visualizar"
                                    >
                                        <Eye size={20} />
                                    </button>
                                    <button
                                        onClick={() => handleOpen(doc.url_arquivo)}
                                        className="p-2.5 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition"
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
