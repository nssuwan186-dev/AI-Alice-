// --- UI & Message Types ---

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text?: string;
  imageUrl?: string;
  block?: AppBlock;
}

export type AppBlock =
  | { type: 'MAIN_MENU'; }
  | { type: 'ROOM_STATUS'; data: RoomStatus; }
  | { type: 'BOOKING_CALENDAR'; data: BookingCalendarData; }
  | { type: 'BOOKING_CONFIRMATION'; data: PreBooking; }
  | { type: 'BOOKING_PENDING_PAYMENT'; data: PendingBooking; }
  | { type: 'FINANCIAL_SUMMARY'; data: FinancialSummary; }
  | { type: 'EMPLOYEE_MANAGEMENT'; data: Employee[]; }
  | { type: 'MONTHLY_TENANT_MANAGEMENT'; data: MonthlyTenant[]; }
  | { type: 'REPORT_LINK'; data: { url: string; type: string }; };

// --- ERP Data Types from Backend ---

export interface RoomStatus {
    vacant: number;
    occupied: number;
    total: number;
}

export interface PreBooking {
    id: string;
    guest_name: string;
    room_id: string;
    room_type: 'Standard' | 'Standard Twin';
    start_date: string; // YYYY-MM-DD
    end_date: string; // YYYY-MM-DD
    dates: string[];
}

export interface PendingBooking {
    id: string;
    guest_name: string;
    room_id: string;
    room_type: 'Standard' | 'Standard Twin';
    start_date: string;
    end_date: string;
    total_cost: number;
    deposit_amount: number;
}

export interface BookingCalendarData {
    bookings: PreBooking[];
    totalRooms: { standard: number; twin: number; total: number; };
}

export interface FinancialSummary {
    period: 'daily' | 'monthly';
    revenue: {
        total: number;
        daily_rooms: number;
        monthly_tenants: number;
    };
    expenses: {
        total: number;
        general: number;
        salaries: number;
    };
    net_profit: number;
}

export interface MonthlyTenant {
    id: string;
    name: string;
    room_id: string;
    rent_amount: number;
}

export interface Employee {
    id: string;
    name: string;
    position: string;
    salary: number;
}

// --- Service Function Parameter and Response Types ---

export interface AddBookingParams {
    guest_name: string;
    room_type: 'Standard' | 'Standard Twin';
    start_date: string; // YYYY-MM-DD
    end_date: string; // YYYY-MM-DD
}

export interface PendingBookingResponse {
    message: string;
    pendingBooking: PendingBooking;
}

export interface AddExpenseParams {
    description: string;
    amount: number;
    image_data?: string; // Base64 encoded image data
    mime_type?: string;  // e.g., 'image/jpeg'
}

export interface AddExpenseResponse {
    message: string;
    expenseId: string;
}

export interface ExportDataResponse {
    message: string;
    fileUrl: string;
}
