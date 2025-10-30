import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string, file: File | null) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [inputText, setInputText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [file]);
  
  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height to recalculate
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Set to content height
    }
  }, [inputText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() || file) {
      onSendMessage(inputText, file);
      setInputText('');
      setFile(null);
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div>
      {previewUrl && (
        <div className="relative inline-block mb-2">
            <img src={previewUrl} alt="Preview" className="h-20 w-20 object-cover rounded-md border-2 border-gray-300 dark:border-gray-600" />
            <button
                onClick={() => {
                  setFile(null);
                  if(fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                aria-label="Remove image"
            >
                <X className="h-3 w-3" />
            </button>
        </div>
      )}
        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            id="file-upload"
            disabled={isLoading}
          />
          <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="p-3 h-12 w-12 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-gray-100 dark:bg-gray-700 rounded-lg transition-colors duration-200 disabled:opacity-50"
              aria-label="Attach file"
          >
              <Paperclip className="h-6 w-6" />
          </button>
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="พิมพ์รายจ่าย หรือคำสั่งอื่นๆ..."
            className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none bg-gray-50 dark:bg-gray-700 dark:text-white"
            rows={1}
            disabled={isLoading}
            style={{maxHeight: '150px'}}
            aria-label="Chat input"
          />
          <button
            type="submit"
            disabled={isLoading || (!inputText.trim() && !file)}
            className="bg-indigo-600 text-white rounded-lg p-3 h-12 w-12 flex items-center justify-center transition-colors duration-200 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send className="h-6 w-6" />
            )}
          </button>
        </form>
    </div>
  );
};
