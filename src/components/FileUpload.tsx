'use client';
import React, { useState } from 'react';

interface FileUploadProps {
  onFileLoaded: (base64Data: string | null, mimeType: string | null) => void;
}

export default function FileUpload({ onFileLoaded }: FileUploadProps) {
  const [fileName, setFileName] = useState<string | null>(null);

  const processImageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetFile = e.target.files?.[0];
    if (!targetFile) return;

    setFileName(targetFile.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      onFileLoaded(base64String, targetFile.type);
    };
    reader.readAsDataURL(targetFile);
  };

  return (
    <div className="flex items-center space-x-2">
      <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 text-xs rounded-xl font-mono border border-zinc-700 transition duration-150 inline-block">
        📎 {fileName ? 'Attached' : 'Add Image'}
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={processImageInput} 
        />
      </label>
      {fileName && (
        <span className="text-[10px] text-zinc-500 max-w-[100px] truncate">{fileName}</span>
      )}
    </div>
  );
}
