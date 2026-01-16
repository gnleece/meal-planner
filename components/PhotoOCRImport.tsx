'use client';

import { useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';

interface PhotoOCRImportProps {
  onExtract: (text: string) => void;
  onClose: () => void;
}

export function PhotoOCRImport({ onExtract, onClose }: PhotoOCRImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleExtract = async () => {
    if (!file) {
      setError('Please select an image file');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();
      
      setExtractedText(text);
    } catch (err: any) {
      setError(`OCR failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUseText = () => {
    if (extractedText.trim()) {
      onExtract(extractedText);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Cookbook Photo
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="mt-1 text-sm text-gray-500">
          Upload a clear photo of a cookbook page or recipe
        </p>
      </div>

      {preview && (
        <div className="space-y-4">
          <div className="relative w-full h-64 bg-gray-200 rounded-md overflow-hidden">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-contain"
            />
          </div>

          {!extractedText && (
            <button
              type="button"
              onClick={handleExtract}
              disabled={isProcessing}
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {isProcessing ? 'Extracting text...' : 'Extract Text from Image'}
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {extractedText && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Extracted Text (edit if needed)
            </label>
            <textarea
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              rows={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleUseText}
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Use This Text
            </button>
            <button
              type="button"
              onClick={() => {
                setExtractedText('');
                setFile(null);
                setPreview(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
