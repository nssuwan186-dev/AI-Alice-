import React from 'react';

const AiIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
       <path d="M20 10.5c0-.28-.22-.5-.5-.5h-2.5v-2.5c0-.28-.22-.5-.5-.5s-.5.22-.5.5v2.5h-2.5c-.28 0-.5.22-.5.5s.22.5.5.5h2.5v2.5c0 .28.22.5.5.5s.5-.22.5-.5v-2.5h2.5c.28 0 .5-.22.5-.5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM9.5 13c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm5 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
    </svg>
);


export const TypingIndicator: React.FC = () => {
    return (
        <div className="flex items-end w-full justify-start">
             <div className="flex items-end max-w-xl flex-row">
                <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-gray-600 mr-3">
                    <AiIcon />
                </div>
                <div className="mx-2 p-4 rounded-2xl shadow-md bg-white dark:bg-gray-700 rounded-bl-none">
                    <div className="flex items-center space-x-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    </div>
                </div>
            </div>
        </div>
    );
};
