import { GoogleGenAI, FunctionDeclaration, Type, GenerateContentResponse, FunctionCall, Chat } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

const tools: FunctionDeclaration[] = [
    {
        name: 'SHOW_MAIN_MENU',
        description: 'แสดงเมนูหลักที่มีคำสั่งให้เลือกทั้งหมด',
        parameters: { type: Type.OBJECT, properties: {} }
    },
    {
        name: 'GET_STATUS',
        description: 'ดูสรุปสถานะห้องพักทั้งหมด ว่ามีห้องว่าง และไม่ว่างกี่ห้อง',
        parameters: { type: Type.OBJECT, properties: {} }
    },
    {
        name: 'GET_BOOKING_CALENDAR',
        description: 'ดูข้อมูลการจองห้องพักในรูปแบบปฏิทิน',
        parameters: { type: Type.OBJECT, properties: {} }
    },
     {
        name: 'ADD_BOOKING',
        description: 'บันทึกข้อมูลการเข้าพักใหม่สำหรับแขกรายวัน',
        parameters: {
            type: Type.OBJECT,
            properties: {
                guest_name: { type: Type.STRING, description: 'ชื่อของแขกที่เข้าพัก' },
                room_type: { type: Type.STRING, description: "ประเภทห้องพัก 'Standard' หรือ 'Standard Twin'", enum: ['Standard', 'Standard Twin'] },
                start_date: { type: Type.STRING, description: 'วันเช็คอิน รูปแบบ YYYY-MM-DD' },
                end_date: { type: Type.STRING, description: 'วันเช็คเอาท์ รูปแบบ YYYY-MM-DD' },
            },
            required: ['guest_name', 'room_type', 'start_date', 'end_date']
        }
    },
     {
        name: 'GET_EMPLOYEE_MANAGEMENT',
        description: 'เข้าสู่เมนูการจัดการข้อมูลพนักงาน',
        parameters: { type: Type.OBJECT, properties: {} }
    },
    {
        name: 'GET_MONTHLY_TENANTS',
        description: 'ดูรายชื่อและข้อมูลผู้เช่ารายเดือนทั้งหมด',
        parameters: { type: Type.OBJECT, properties: {} }
    },
    {
        name: 'GET_FINANCIAL_SUMMARY',
        description: 'ดูสรุปการเงินภาพรวม สามารถระบุเป็นรายวันหรือรายเดือนได้',
        parameters: {
            type: Type.OBJECT,
            properties: {
                period: {
                    type: Type.STRING,
                    description: "ช่วงเวลาที่ต้องการสรุปผล 'daily' สำหรับรายวัน หรือ 'monthly' สำหรับรายเดือน",
                    enum: ['daily', 'monthly']
                }
            },
            required: ['period']
        }
    },
    {
        name: 'ADD_EXPENSE',
        description: 'บันทึกรายการรายจ่ายใหม่ ประกอบด้วยจำนวนเงินและรายละเอียด',
        parameters: {
            type: Type.OBJECT,
            properties: {
                amount: { type: Type.NUMBER, description: 'จำนวนเงินของรายจ่าย' },
                description: { type: Type.STRING, description: 'รายละเอียดของรายจ่าย เช่น ค่ากาแฟ, ค่าวัสดุ' }
            },
            required: ['amount', 'description']
        }
    },
    {
        name: 'EXPORT_DATA',
        description: 'ส่งออกข้อมูล เช่น สรุปการเงิน, สถานะห้อง, รายชื่อพนักงาน หรือผู้เช่ารายเดือน ไปยังไฟล์ Google Sheet และให้ลิงก์สำหรับดาวน์โหลดหรือเปิดดู',
        parameters: {
            type: Type.OBJECT,
            properties: {
                report_type: {
                    type: Type.STRING,
                    description: 'ประเภทของข้อมูลที่ต้องการส่งออก',
                    enum: ['FINANCIAL_SUMMARY', 'ROOM_STATUS', 'EMPLOYEE_MANAGEMENT', 'MONTHLY_TENANT_MANAGEMENT']
                },
                data_to_export: {
                    type: Type.ANY,
                    description: 'ข้อมูล object หรือ array ของข้อมูลที่จะถูกส่งออก'
                }
            },
            required: ['report_type', 'data_to_export']
        }
    }
];

export const startChatSession = (): Chat => {
    return ai.chats.create({
        model: model,
        config: {
            systemInstruction: 'คุณคือผู้ช่วย AI สำหรับจัดการโรงแรม (Hotel ERP Assistant) ที่ฉลาดและเชี่ยวชาญ ตอบเป็นภาษาไทยเสมอ ทำความเข้าใจคำสั่งของผู้ใช้และเรียกใช้ฟังก์ชันที่เหมาะสมเพื่อทำงานให้สำเร็จ เมื่อจัดการการจองห้องพัก คุณต้องตีความวันที่จากภาษาพูดให้เป็นรูปแบบ YYYY-MM-DD ได้เอง เช่น "วันนี้", "พรุ่งนี้", "วันที่ 19", "20 ตุลา" หรือปี พ.ศ. (เช่น 2568 ต้องแปลงเป็น 2025) โดยไม่ต้องถามผู้ใช้ซ้ำเรื่องรูปแบบวันที่ เมื่อได้รับคำสั่งเช็คอิน ให้รวบรวมข้อมูลที่จำเป็น: "ชื่อผู้เข้าพัก", "ประเภทห้อง" ("Standard" หรือ "Standard Twin"), "วันเช็คอิน", และ "วันเช็คเอาท์" หากข้อมูลส่วนอื่นขาดหายไป ให้ถามกลับเพื่อขอข้อมูลเพิ่มเติมจนครบ แล้วจึงเรียกใช้ฟังก์ชัน ADD_BOOKING เสมอ หลังจากเรียก ADD_BOOKING คุณจะได้รับข้อมูลการจองที่ "รอการชำระเงิน" พร้อมยอดมัดจำ ให้แจ้งผู้ใช้ว่าการจองยังไม่สมบูรณ์ และแนะนำให้ผู้ใช้อัปโหลดสลิปเพื่อยืนยันการจอง หากผู้ใช้ต้องการบันทึกรายจ่าย (อาจมีการแนบรูปภาพบิลมาด้วย) ให้รวบรวมข้อมูล "จำนวนเงิน" และ "รายละเอียด" จากข้อความ แล้วเรียกใช้ฟังก์ชัน ADD_EXPENSE หากผู้ใช้ต้องการส่งออกข้อมูลหรือสร้างรายงาน ให้เรียกใช้ฟังก์ชัน EXPORT_DATA พร้อมระบุประเภทข้อมูลและข้อมูลที่เกี่ยวข้อง หากผู้ใช้ขอดูเมนู ให้เรียกฟังก์ชัน SHOW_MAIN_MENU',
            tools: [{ functionDeclarations: tools }],
        },
    });
};

export const sendChatMessage = async (
    chat: Chat,
    message: string,
): Promise<GenerateContentResponse> => {
    try {
        const result = await chat.sendMessage({ message });
        return result;
    } catch (error) {
        console.error("Error sending message to Gemini:", error);
        throw new Error("Failed to get response from Gemini API.");
    }
};

export const sendFunctionResponse = async (
    chat: Chat,
    functionCall: FunctionCall,
    functionResult: any,
): Promise<GenerateContentResponse> => {
     try {
        // The Gemini API requires the 'response' field to be a JSON object.
        // This ensures that even primitive values (like strings or numbers) are wrapped correctly.
        const responsePayload = typeof functionResult === 'object' && functionResult !== null
            ? functionResult
            : { result: functionResult };

        const functionResponsePart = {
            functionResponse: {
                name: functionCall.name,
                response: responsePayload,
            }
        };
        
        // FIX: Wrap the Part array in an object with a 'message' key.
        // This resolves the "ContentUnion is required" error by using the same
        // calling convention as text messages, which is more robust.
        const result = await chat.sendMessage({ message: [functionResponsePart] });
        
        return result;

     } catch (error) {
        console.error("Error sending function result to Gemini:", error);
        throw new Error("Failed to send function result to Gemini API.");
     }
}