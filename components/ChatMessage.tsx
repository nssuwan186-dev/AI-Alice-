import React from 'react';
import { Message } from '../types';
import { MainMenuBlock, RoomStatusBlock, BookingCalendarBlock, FinancialSummaryBlock, EmployeeManagementBlock, MonthlyTenantBlock, ReportLinkBlock, BookingConfirmationBlock, BookingPendingPaymentBlock } from './blocks';

interface ChatMessageProps {
  message: Message;
  onExecuteAction: (action: { action_type: string, parameters: any }) => void;
}

const UserIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4-4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
);

const AiIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
       <path d="M20 10.5c0-.28-.22-.5-.5-.5h-2.5v-2.5c0-.28-.22-.5-.5-.5s-.5.22-.5.5v2.5h-2.5c-.28 0-.5.22-.5.5s.22.5.5.5h2.5v2.5c0 .28.22.5.5.5s.5-.22.5-.5v-2.5h2.5c.28 0 .5-.22.5-.5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM9.5 13c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm5 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
    </svg>
);

const BlockRenderer: React.FC<{ block: NonNullable<Message['block']>, onExecuteAction: ChatMessageProps['onExecuteAction'] }> = ({ block, onExecuteAction }) => {
    switch (block.type) {
        case 'MAIN_MENU':
            return <MainMenuBlock onExecuteAction={onExecuteAction} />;
        case 'ROOM_STATUS':
            return <RoomStatusBlock roomStatuses={block.data} onExecuteAction={onExecuteAction} />;
        case 'BOOKING_CALENDAR':
            return <BookingCalendarBlock bookings={block.data.bookings} totalRooms={block.data.totalRooms} />;
        case 'BOOKING_CONFIRMATION':
            return <BookingConfirmationBlock booking={block.data} />;
        case 'BOOKING_PENDING_PAYMENT':
            return <BookingPendingPaymentBlock booking={block.data} />;
        case 'FINANCIAL_SUMMARY':
            return <FinancialSummaryBlock summary={block.data} onExecuteAction={onExecuteAction} />;
        case 'EMPLOYEE_MANAGEMENT':
            return <EmployeeManagementBlock employees={block.data} onExecuteAction={onExecuteAction} />;
        case 'MONTHLY_TENANT_MANAGEMENT':
            return <MonthlyTenantBlock tenants={block.data} onExecuteAction={onExecuteAction} />;
        case 'REPORT_LINK':
            return <ReportLinkBlock url={block.data.url} reportType={block.data.type} />;
        default:
            return <div className="text-red-500">Error: Unknown block type</div>;
    }
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onExecuteAction }) => {
  const isUser = message.sender === 'user';
  
  const messageAlignment = isUser ? 'justify-end' : 'justify-start';
  const bubbleStyles = isUser
    ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-none'
    : 'bg-white dark:bg-gray-700 dark:text-gray-200 text-gray-800 rounded-bl-none';
  const iconContainerStyles = isUser 
    ? 'bg-indigo-500 ml-3'
    : 'bg-gray-600 mr-3';
  const icon = isUser ? <UserIcon /> : <AiIcon />;

  return (
    <div className={`flex items-end w-full ${messageAlignment}`}>
        <div className={`flex items-end ${isUser ? 'flex-row-reverse' : 'flex-row'}`} style={{maxWidth: 'calc(100% - 52px)'}}>
            <div className={`flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full ${iconContainerStyles}`}>
                {icon}
            </div>
            <div className={`mx-2 p-1 rounded-2xl shadow-lg transition-transform duration-200 hover:scale-[1.02] ${message.block ? 'bg-transparent shadow-none w-full max-w-lg' : bubbleStyles}`}>
                 <div className="p-3">
                    {message.imageUrl && (
                        <img src={message.imageUrl} alt="Uploaded content" className="max-w-xs max-h-48 rounded-lg mb-2 border-2 border-white dark:border-gray-600" />
                    )}
                    {message.text && (
                        <p className="text-sm md:text-base whitespace-pre-wrap">{message.text}</p>
                    )}
                </div>
                {message.block && (
                    <BlockRenderer block={message.block} onExecuteAction={onExecuteAction} />
                )}
            </div>
        </div>
    </div>
  );
};
