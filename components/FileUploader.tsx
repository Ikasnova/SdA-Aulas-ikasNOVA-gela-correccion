import React, { useCallback } from 'react';
import { Language } from '../types';
import { translations } from '../utils/translations';

interface Props {
  onFileSelected: (file: File) => void;
  disabled: boolean;
  language: Language;
}

const FileUploader: React.FC<Props> = ({ onFileSelected, disabled, language }) => {
  const t = translations[language];

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndEmit(file);
    }
  }, [disabled, onFileSelected]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndEmit(e.target.files[0]);
    }
  };

  const validateAndEmit = (file: File) => {
    const validExtensions = ['.elp', '.elpx', '.zip'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (isValid) {
      onFileSelected(file);
    } else {
      alert(t.errorFile);
    }
  };

  // Palette colors
  const colors = {
    borderIdle: '#E8EFF4',
    borderHover: '#3eb7ae', // Turquoise
    textLink: '#277cd4', // Bright Blue
    icon: '#6080a3' // Blue Grey
  };

  return (
    <div 
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); }}
      className={`group mt-1 flex justify-center px-6 pt-10 pb-10 border-2 border-dashed rounded-md transition-all duration-200`}
      style={{ 
        borderColor: disabled ? colors.borderIdle : colors.borderIdle,
        backgroundColor: '#f8fafb',
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
      onMouseEnter={(e) => { if(!disabled) e.currentTarget.style.borderColor = colors.borderHover; }}
      onMouseLeave={(e) => { if(!disabled) e.currentTarget.style.borderColor = colors.borderIdle; }}
    >
      <div className="space-y-2 text-center">
        <svg 
          className="mx-auto h-12 w-12 transition-colors duration-200 group-hover:scale-110 transform" 
          style={{ color: disabled ? '#cbd5e1' : colors.icon }}
          stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"
        >
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="flex text-sm justify-center">
          <label htmlFor="file-upload" className={`relative cursor-pointer font-bold focus-within:outline-none ${disabled ? 'pointer-events-none text-gray-400' : ''}`} style={{ color: disabled ? undefined : colors.textLink }}>
            <span>{t.dropText}</span>
            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleChange} disabled={disabled} accept=".elp,.elpx,.zip" />
          </label>
          <p className="pl-1 text-gray-500">{t.dragText}</p>
        </div>
        <p className="text-xs text-gray-400 font-normal">
          {t.maxSize}
        </p>
      </div>
    </div>
  );
};

export default FileUploader;