import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Check } from 'lucide-react';

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
  buttonText?: string;
  className?: string;
}

export function FileUpload({
  onFileSelected,
  accept = 'image/*',
  maxSizeMB = 5,
  buttonText = 'Upload File',
  className = '',
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxSizeBytes) {
      setError(`File size exceeds ${maxSizeMB}MB limit`);
      return false;
    }
    
    // Check file type if accept is specified
    if (accept && accept !== '*') {
      const fileType = file.type;
      const acceptTypes = accept.split(',').map(type => type.trim());
      
      // Handle wildcards like 'image/*'
      const isAccepted = acceptTypes.some(type => {
        if (type.endsWith('/*')) {
          const category = type.split('/')[0];
          return fileType.startsWith(`${category}/`);
        }
        return type === fileType;
      });
      
      if (!isAccepted) {
        setError(`File type not accepted. Please upload ${accept}`);
        return false;
      }
    }
    
    setError(null);
    return true;
  };
  
  const handleFile = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      setIsSuccess(false);
      onFileSelected(file);
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };
  
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFile(file);
    }
  };
  
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleClearFile = () => {
    setSelectedFile(null);
    setError(null);
    setIsSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className={`w-full ${className}`}>
      <div
        className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : error
            ? 'border-red-300 bg-red-50'
            : isSuccess
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept={accept}
          className="hidden"
          disabled={isUploading}
          aria-label="File upload"
        />
        
        {selectedFile ? (
          <div className="flex w-full flex-col items-center space-y-2">
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center space-x-2">
                {isSuccess ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <Upload className="h-5 w-5 text-blue-500" />
                )}
                <span className="text-sm font-medium">
                  {selectedFile.name}
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearFile}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                disabled={isUploading}
                aria-label="Clear selected file"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear selected file</span>
              </button>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className={`h-full rounded-full ${
                  error
                    ? 'bg-red-500'
                    : isSuccess
                    ? 'bg-green-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: isSuccess ? '100%' : '0%' }}
              ></div>
            </div>
          </div>
        ) : (
          <>
            <Upload className="mb-2 h-10 w-10 text-gray-400" />
            <p className="mb-1 text-sm font-medium text-gray-700">
              Drag and drop your file here
            </p>
            <p className="mb-4 text-xs text-gray-500">
              or click to browse (max {maxSizeMB}MB)
            </p>
            <Button
              type="button"
              onClick={handleButtonClick}
              disabled={isUploading}
              variant="outline"
            >
              {buttonText}
            </Button>
          </>
        )}
        
        {error && (
          <div className="mt-2 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
