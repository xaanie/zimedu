import React, { useState, useEffect } from 'react';
import { LibraryDocument } from '../types';
import { createPDFBlobFromText } from '../utils/pdfGenerator';
import { DEFAULT_EXAMS } from '../data/defaultExams';

const LibraryManager: React.FC = () => {
  const [userDocuments, setUserDocuments] = useState<LibraryDocument[]>([]);
  const [defaultDocuments, setDefaultDocuments] = useState<LibraryDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<LibraryDocument | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Mobile specific: list vs detail view
  const [showViewerOnMobile, setShowViewerOnMobile] = useState(false);
  
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedDocs = localStorage.getItem('zimed_library');
      if (storedDocs) {
        setUserDocuments(JSON.parse(storedDocs));
      }
    } catch (err) {
      console.error("Failed to load user library", err);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('zimed_library', JSON.stringify(userDocuments));
    } catch (err) {
      setError("Storage full! Please delete some old files.");
    }
  }, [userDocuments]);

  useEffect(() => {
    const generateDefaults = async () => {
        const docs: LibraryDocument[] = DEFAULT_EXAMS.map((exam, index) => {
            return {
                id: `default-${index}`,
                name: exam.title,
                category: 'Past Papers',
                uploadDate: 'System',
                dataUrl: '',
                size: '20 KB',
                type: 'application/pdf',
                isDefault: true,
                _content: exam.content 
            } as any;
        });
        setDefaultDocuments(docs);
    };
    generateDefaults();
  }, []);

  useEffect(() => {
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl);
      setPdfPreviewUrl(null);
    }

    if (selectedDoc) {
      if (selectedDoc.isDefault) {
          const content = (selectedDoc as any)._content;
          const blob = createPDFBlobFromText(selectedDoc.name, content);
          const url = URL.createObjectURL(blob);
          setPdfPreviewUrl(url);
      } else {
          const isPdf = selectedDoc.type === 'application/pdf' || selectedDoc.name.toLowerCase().endsWith('.pdf');
          if (isPdf) {
            try {
              const parts = selectedDoc.dataUrl.split(',');
              const base64 = parts.length > 1 ? parts[1] : parts[0];
              const byteCharacters = atob(base64);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: 'application/pdf' });
              const url = URL.createObjectURL(blob);
              setPdfPreviewUrl(url);
            } catch (e) {
              console.error("Error creating PDF blob", e);
            }
          }
      }
    }
    
    return () => {
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    };
  }, [selectedDoc]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];

    const readFile = (file: File): Promise<LibraryDocument | null> => {
      return new Promise((resolve) => {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!allowedExtensions.includes(ext) || file.size > 5 * 1024 * 1024) {
             resolve(null); 
             return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          resolve({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: file.name,
            category: 'Past Papers',
            uploadDate: new Date().toLocaleDateString(),
            dataUrl: result,
            size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
            type: file.type || 'application/octet-stream',
            isDefault: false
          });
        };
        reader.readAsDataURL(file);
      });
    };

    try {
      const promises = Array.from(files).map(file => readFile(file as File));
      const results = await Promise.all(promises);
      const validResults = results.filter((doc): doc is LibraryDocument => doc !== null);
      if (validResults.length > 0) {
        setUserDocuments(prev => [...prev, ...validResults]);
      } else {
          setError("No valid files. PDF/Word/Excel max 5MB.");
      }
    } catch (e) {
      setError("Error processing files.");
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDownload = (doc: LibraryDocument) => {
     const url = doc.isDefault ? pdfPreviewUrl : doc.dataUrl;
     if (url) {
         const link = document.createElement('a');
         link.href = url;
         link.download = doc.isDefault ? `${doc.name}.pdf` : doc.name;
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
     }
  };

  const getFileIcon = (doc: LibraryDocument) => {
    if (doc.isDefault) return <i className="fas fa-file-pdf text-red-600 text-lg"></i>;
    const name = doc.name.toLowerCase();
    const type = doc.type.toLowerCase();
    if (type.includes('pdf') || name.endsWith('.pdf')) return <i className="fas fa-file-pdf text-red-600 text-lg"></i>;
    if (type.includes('word') || name.endsWith('.doc') || name.endsWith('.docx')) return <i className="fas fa-file-word text-blue-600 text-lg"></i>;
    if (type.includes('sheet') || type.includes('excel') || name.endsWith('.xls') || name.endsWith('.xlsx')) return <i className="fas fa-file-excel text-green-600 text-lg"></i>;
    return <i className="fas fa-file text-gray-400 text-lg"></i>;
  };

  const displayDocs = [...defaultDocuments, ...userDocuments];

  return (
    <div className="max-w-7xl mx-auto animate-fade-in flex flex-col h-[calc(100vh-140px)] md:h-[700px]">
      <div className="text-center mb-4 shrink-0 px-2">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Resource Library</h2>
      </div>

      <div className="flex-grow flex flex-col md:flex-row gap-4 min-h-0 bg-white md:bg-transparent rounded-xl md:rounded-none overflow-hidden shadow-lg md:shadow-none border md:border-none">
        
        {/* Sidebar / List View */}
        <div className={`flex flex-col w-full md:w-1/3 bg-white md:rounded-xl shadow-md border-r md:border border-gray-200 transition-all ${showViewerOnMobile ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex border-b border-gray-200 shrink-0">
            <div className="flex-1 py-3 text-xs md:text-sm font-bold text-center bg-zim-green text-white">
              Past Papers
            </div>
          </div>

          <div className="p-3 bg-gray-50 border-b border-gray-200 shrink-0">
            <label className="flex flex-col items-center px-4 py-3 bg-white text-zim-green rounded-lg shadow-sm border border-zim-green cursor-pointer hover:bg-green-50 active:scale-95 transition-all">
                <i className="fas fa-cloud-upload-alt text-xl mb-1"></i>
                <span className="text-[10px] font-bold uppercase tracking-tight">{uploading ? 'Uploading...' : `Upload Document`}</span>
                <input type='file' className="hidden" multiple accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={handleFileUpload} disabled={uploading} />
            </label>
            {error && <p className="text-red-500 text-[10px] mt-2 text-center font-bold uppercase">{error}</p>}
          </div>

          <div className="flex-grow overflow-y-auto custom-scrollbar p-2 space-y-2">
            {displayDocs.length === 0 ? (
              <div className="text-center text-gray-300 mt-10 p-4">
                <i className="fas fa-folder-open text-3xl mb-2 opacity-30"></i>
                <p className="text-sm">No files here.</p>
              </div>
            ) : (
              displayDocs.map(doc => (
                <div 
                  key={doc.id}
                  onClick={() => { setSelectedDoc(doc); setShowViewerOnMobile(true); }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between group ${selectedDoc?.id === doc.id ? 'bg-green-50 border-zim-green' : 'bg-white border-gray-100'}`}
                >
                  <div className="flex items-center overflow-hidden mr-2">
                    <div className="w-8 h-8 rounded flex items-center justify-center mr-2 shrink-0 bg-gray-50">{getFileIcon(doc)}</div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-[13px] text-gray-800 truncate">{doc.name}</h4>
                      <p className="text-[10px] text-gray-500 uppercase">{doc.uploadDate} • {doc.size}</p>
                    </div>
                  </div>
                  <i className="fas fa-chevron-right text-gray-300 md:hidden"></i>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Viewer Area */}
        <div className={`flex flex-col w-full md:w-2/3 bg-gray-900 md:rounded-xl shadow-lg border border-gray-700 overflow-hidden h-full ${!showViewerOnMobile ? 'hidden md:flex' : 'flex'}`}>
          {selectedDoc ? (
            <>
              <div className="bg-gray-800 text-white p-3 flex justify-between items-center border-b border-gray-700 shrink-0">
                <button onClick={() => setShowViewerOnMobile(false)} className="md:hidden mr-3 text-zim-yellow p-1">
                   <i className="fas fa-arrow-left"></i>
                </button>
                <span className="font-medium truncate text-xs md:text-sm mr-2">{selectedDoc.name}</span>
                <button onClick={() => handleDownload(selectedDoc)} className="bg-zim-green hover:bg-green-800 text-white text-[10px] px-3 py-2 rounded font-bold uppercase shrink-0">
                  <i className="fas fa-download mr-1"></i> Save
                </button>
              </div>
              
              <div className="flex-grow bg-white relative">
                 {pdfPreviewUrl ? (
                    <iframe src={pdfPreviewUrl} className="w-full h-full border-none" title="PDF Viewer" />
                 ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gray-100">
                        <div className="mb-4 text-5xl opacity-20">{getFileIcon(selectedDoc)}</div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Preview Not Supported</h3>
                        <p className="text-xs text-gray-500 mb-6">This file cannot be previewed on mobile. Please download it.</p>
                        <button onClick={() => handleDownload(selectedDoc)} className="bg-zim-green text-white font-bold py-3 px-8 rounded-full shadow-lg">
                            <i className="fas fa-download mr-2"></i> Download File
                        </button>
                    </div>
                 )}
              </div>
            </>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-gray-500 p-10 bg-gray-800/50">
              <i className="fas fa-book-reader text-5xl mb-4 opacity-20"></i>
              <p className="text-sm uppercase tracking-widest font-bold">Select a Document</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LibraryManager;