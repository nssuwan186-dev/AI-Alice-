import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, AppBlock } from './types';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { Header } from './components/Header';
import { TypingIndicator } from './components/TypingIndicator';
import * as erpService from './services/erpService';
import * as geminiService from './services/geminiService';
import type { Chat, FunctionCall } from '@google/genai';
import { useTheme } from './hooks/useTheme';

// Helper to convert a File object to a base64 string
const fileToBase64 = (file: File): Promise<{ data: string, mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const mimeType = result.split(',')[0].split(':')[1].split(';')[0];
      const data = result.split(',')[1];
      resolve({ data, mimeType });
    };
    reader.onerror = (error) => reject(error);
  });
};


const App: React.FC = () => {
  useTheme(); // Initialize and manage theme changes
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Add welcome message, and start chat session on component mount
  useEffect(() => {
    setChat(geminiService.startChatSession());
    setMessages([
      {
        id: 'initial-message-1',
        sender: 'ai',
        text: `สวัสดีครับ! ผมคือผู้ช่วยจัดการโรงแรม AI ของคุณ\n\nพิมพ์ "เมนู" เพื่อดูคำสั่งทั้งหมด หรือพิมพ์คำสั่งอื่นๆ ได้เลยครับ`,
      },
    ]);
  }, []);


  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Executes a function call, displays the resulting block, and returns data for Gemini.
  const executeAction = useCallback(async (action: { action_type: string, parameters: any }) => {
      let responseBlock: AppBlock | null = null;
      let functionResponse: any = 'Action completed successfully.';

      try {
        switch (action.action_type) {
          case 'SHOW_MAIN_MENU': {
            responseBlock = { type: 'MAIN_MENU' };
            functionResponse = { status: "Main menu has been displayed to the user." };
            break;
          }
          case 'GET_STATUS': {
            const status = await erpService.getRoomStatus();
            responseBlock = { type: 'ROOM_STATUS', data: status };
            functionResponse = status;
            break;
          }
          case 'GET_BOOKING_CALENDAR': {
             const data = await erpService.getBookingCalendarData();
             responseBlock = { type: 'BOOKING_CALENDAR', data: data };
             functionResponse = data.bookings;
             break;
          }
          case 'ADD_BOOKING': {
            const bookingResponse = await erpService.addBooking(action.parameters);
            responseBlock = { type: 'BOOKING_PENDING_PAYMENT', data: bookingResponse.pendingBooking };
            functionResponse = { status: "Booking initiated, awaiting payment", details: bookingResponse.pendingBooking };
            break;
          }
          case 'GET_FINANCIAL_SUMMARY': {
              const summary = await erpService.getFinancialSummary(action.parameters.period);
              responseBlock = { type: 'FINANCIAL_SUMMARY', data: summary };
              functionResponse = summary;
              break;
          }
           case 'GET_MONTHLY_TENANTS': {
              const tenants = await erpService.getMonthlyTenants();
              responseBlock = { type: 'MONTHLY_TENANT_MANAGEMENT', data: tenants };
              functionResponse = tenants;
              break;
          }
          case 'GET_EMPLOYEE_MANAGEMENT': {
              const employees = await erpService.getEmployees();
              responseBlock = { type: 'EMPLOYEE_MANAGEMENT', data: employees };
              functionResponse = employees;
              break;
          }
          case 'ADD_EXPENSE': {
            // Now passing all parameters, including optional image data
            const response = await erpService.addExpense(action.parameters);
            functionResponse = { ...response, status: "Success" };
            break;
          }
          case 'EXPORT_DATA': {
              const { report_type, data_to_export } = action.parameters;
              const response = await erpService.exportDataToSheet(report_type, data_to_export);
              responseBlock = { type: 'REPORT_LINK', data: { url: response.fileUrl, type: report_type } };
              functionResponse = response;
              break;
          }
          default:
             console.warn(`Unknown action type: ${action.action_type}`);
             functionResponse = `Unknown action: ${action.action_type}`;
        }

        if (responseBlock) {
          setMessages(prev => [...prev, { id: crypto.randomUUID(), sender: 'ai', block: responseBlock }]);
        }
        return functionResponse;

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่คาดคิด';
        setError(`ขออภัย, เกิดข้อผิดพลาด: ${errorMessage}`);
        return `Error executing action: ${errorMessage}`;
      }
  }, []);

  // Handles actions initiated from the UI (e.g., button clicks)
  const handleUiAction = useCallback(async (action: { action_type: string, parameters: any }) => {
    if (isLoading || !chat) return;

    setIsLoading(true);
    setError(null);

    try {
        // For export actions triggered from UI, fetch fresh data first.
        let actionToExecute = { ...action };
        if (action.action_type === 'EXPORT_DATA') {
            const { report_type, params } = action.parameters;
            let freshData;
            switch(report_type) {
                case 'ROOM_STATUS': freshData = await erpService.getRoomStatus(); break;
                case 'FINANCIAL_SUMMARY': freshData = await erpService.getFinancialSummary(params.period); break;
                case 'MONTHLY_TENANT_MANAGEMENT': freshData = await erpService.getMonthlyTenants(); break;
                case 'EMPLOYEE_MANAGEMENT': freshData = await erpService.getEmployees(); break;
                default: freshData = {};
            }
            actionToExecute.parameters.data_to_export = freshData;
        }

        const functionResult = await executeAction(actionToExecute);

        if (typeof functionResult === 'string' && functionResult.startsWith('Error executing action:')) {
            setIsLoading(false);
            return;
        }

        const mockFunctionCall: FunctionCall = {
            name: actionToExecute.action_type,
            args: actionToExecute.parameters,
        };

        const finalResponse = await geminiService.sendFunctionResponse(
            chat,
            mockFunctionCall,
            functionResult
        );

        if (finalResponse.text) {
            const aiTextMessage: Message = {
                id: crypto.randomUUID(),
                text: finalResponse.text,
                sender: 'ai',
            };
            setMessages((prevMessages) => [...prevMessages, aiTextMessage]);
        }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่คาดคิด';
      setError(`ขออภัย, เกิดข้อผิดพลาด: ${errorMessage}`);
      setMessages((prevMessages) => [...prevMessages, {
        id: crypto.randomUUID(),
        text: `ขออภัยครับ เกิดข้อผิดพลาด: ${errorMessage}`,
        sender: 'ai',
      }]);
    } finally {
        setIsLoading(false);
    }
}, [isLoading, executeAction, chat]);

  const handleSendMessage = useCallback(async (inputText: string, file: File | null) => {
    if ((!inputText.trim() && !file) || isLoading || !chat) return;

    let userMessage: Message = {
      id: crypto.randomUUID(),
      sender: 'user',
    };
    
    let imagePayload: { data: string, mimeType: string } | null = null;
    
    if (file) {
      userMessage.imageUrl = URL.createObjectURL(file); // For instant preview
      imagePayload = await fileToBase64(file);
    }
    if (inputText.trim()) {
        userMessage.text = inputText;
    }


    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setIsLoading(true);
    setError(null);
    
    try {
        const geminiResponse = await geminiService.sendChatMessage(chat, inputText || "Attached an expense bill.");

        if (geminiResponse.functionCalls) {
            for (const call of geminiResponse.functionCalls) {
                 // If the action is ADD_EXPENSE and there's an image, add it to the parameters.
                const actionParams = { ...call.args };
                if (call.name === 'ADD_EXPENSE' && imagePayload) {
                    actionParams.image_data = imagePayload.data;
                    actionParams.mime_type = imagePayload.mimeType;
                }
                 // If AI wants to export, it needs to fetch the data first.
                if (call.name === 'EXPORT_DATA') {
                    const reportType = actionParams.report_type;
                    let freshData;
                    switch (reportType) {
                        case 'ROOM_STATUS': freshData = await erpService.getRoomStatus(); break;
                        case 'FINANCIAL_SUMMARY': freshData = await erpService.getFinancialSummary(actionParams.data_to_export.period); break;
                        case 'MONTHLY_TENANT_MANAGEMENT': freshData = await erpService.getMonthlyTenants(); break;
                        case 'EMPLOYEE_MANAGEMENT': freshData = await erpService.getEmployees(); break;
                        default: freshData = {};
                    }
                    actionParams.data_to_export = freshData;
                }

                const functionResult = await executeAction({ 
                    action_type: call.name, 
                    parameters: actionParams 
                });

                // If the action was just to show the menu, we don't need a text response from the AI.
                // The menu block itself is the response, so we skip sending the result back.
                if (call.name === 'SHOW_MAIN_MENU') {
                    continue; 
                }

                if (typeof functionResult === 'string' && functionResult.startsWith('Error executing action:')) {
                    setIsLoading(false);
                    return; // Stop processing further calls if one fails
                }
                
                const finalResponse = await geminiService.sendFunctionResponse(
                    chat, 
                    call, 
                    functionResult, 
                );
                
                if(finalResponse.text) {
                    setMessages((prev) => [...prev, { id: crypto.randomUUID(), text: finalResponse.text, sender: 'ai' }]);
                }
            }
        } else if (geminiResponse.text) {
            setMessages((prev) => [...prev, { id: crypto.randomUUID(), text: geminiResponse.text, sender: 'ai' }]);
        }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่คาดคิด';
      setError(`ขออภัย, ไม่สามารถเชื่อมต่อกับ AI ได้: ${errorMessage}`);
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        text: `ขออภัยครับ เกิดข้อผิดพลาดในการสื่อสาร: ${errorMessage}`,
        sender: 'ai',
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, executeAction, chat]);

  return (
    <>
      <div className="flex flex-col h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900 font-sans">
        <Header />
        <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} onExecuteAction={handleUiAction} />
          ))}
          {isLoading && <TypingIndicator />}
        </main>
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          {error && (
              <div className="text-center text-red-500 text-sm mb-2 p-2 bg-red-100 dark:bg-red-900/20 rounded-md">
                  {error}
              </div>
          )}
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading || !chat} />
        </footer>
      </div>
    </>
  );
};

export default App;
