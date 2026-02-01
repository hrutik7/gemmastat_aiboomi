import { useState, useRef } from 'react';
import { FiUploadCloud, FiFile, FiCheck, FiX } from 'react-icons/fi';

function FileUpload({ onUploadSuccess, isStandalone = false }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const processFile = async (selectedFile) => {
    if (selectedFile) {
      setFile(selectedFile);
      if (isStandalone && onUploadSuccess) {
        setIsUploading(true);
        // Small delay to show the file was selected
        await new Promise(resolve => setTimeout(resolve, 500));
        onUploadSuccess(selectedFile);
        setIsUploading(false);
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const clearFile = (e) => {
    e.stopPropagation();
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept=".csv, .tsv, .xlsx, .xls"
      />
      
      {/* Main upload area */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={`
          relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200
          ${isDragging 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]' 
            : file 
              ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
          }
        `}
      >
        <div className="p-8 flex flex-col items-center justify-center min-h-[200px]">
          {isUploading ? (
            // Uploading state
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mb-4"></div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Uploading...</p>
            </div>
          ) : file ? (
            // File selected state
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mb-4">
                <FiCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <FiFile className="text-gray-500" />
                <span className="font-medium text-gray-800 dark:text-gray-200">{file.name}</span>
                <button 
                  onClick={clearFile}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
                >
                  <FiX className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">File ready! Processing...</p>
            </div>
          ) : (
            // Default upload state
            <>
              <div className={`
                w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-all
                ${isDragging 
                  ? 'bg-blue-100 dark:bg-blue-900/50 scale-110' 
                  : 'bg-gray-100 dark:bg-gray-700'
                }
              `}>
                <FiUploadCloud className={`w-10 h-10 transition-colors ${isDragging ? 'text-blue-600' : 'text-gray-400 dark:text-gray-500'}`} />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                {isDragging ? 'Drop your file here!' : 'Upload your data file'}
              </h3>
              
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
                Drag and drop your file here, or <span className="text-blue-600 dark:text-blue-400 font-medium">click to browse</span>
              </p>
              
              {/* Supported formats */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {[
                  { name: 'CSV', color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' },
                  { name: 'Excel', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' },
                  { name: 'TSV', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
                ].map((format) => (
                  <span 
                    key={format.name}
                    className={`px-3 py-1 text-xs font-medium rounded-full ${format.color}`}
                  >
                    {format.name}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Help text */}
      <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-3">
        Maximum file size: 50MB • Supported formats: CSV, TSV, Excel (.xlsx, .xls)
      </p>
    </div>
  );
}

export default FileUpload;
