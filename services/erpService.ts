// Fix: Import all necessary types from the central types.ts file.
import {
    RoomStatus,
    PreBooking,
    Employee,
    MonthlyTenant,
    FinancialSummary,
    PendingBooking,
    BookingCalendarData,
    AddBookingParams,
    PendingBookingResponse,
    AddExpenseParams,
    AddExpenseResponse,
    ExportDataResponse
} from '../types';

// The Google Apps Script URL provided by the user.
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxb1W5E0C86YZrVrOSVm5bDSn6nblp9zTdm-y2ptvMzIj5TeIQD1COWHVhvC8_xc9IASA/exec';

/**
 * A generic helper function to make POST requests to our Google Apps Script backend.
 * @param action - The action to be performed by the backend.
 * @returns The data from the backend.
 */
async function fetchFromGAS<T>(action: { action_type: string; parameters?: any }): Promise<T> {
  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Apps Script web apps often work best with text/plain
      },
      body: JSON.stringify(action),
      mode: 'cors', // Important for cross-origin requests
    });

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.status === 'error') {
      console.error('Apps Script Error:', result.message, result.stack);
      throw new Error(`Backend error: ${result.message}`);
    }

    return result.data as T;
  } catch (error) {
    console.error('Failed to fetch from Google Apps Script:', error);
    if (error instanceof Error) {
        throw new Error(`Could not connect to the backend service: ${error.message}`);
    }
    throw new Error('An unknown error occurred while connecting to the backend.');
  }
}

export const getRoomStatus = async (): Promise<RoomStatus> => {
  return await fetchFromGAS<RoomStatus>({ action_type: 'GET_STATUS' });
};

export const getBookingCalendarData = async (): Promise<BookingCalendarData> => {
    return await fetchFromGAS<BookingCalendarData>({ action_type: 'GET_BOOKING_CALENDAR' });
};

export const addBooking = async (params: AddBookingParams): Promise<PendingBookingResponse> => {
    return await fetchFromGAS<PendingBookingResponse>({
        action_type: 'ADD_BOOKING',
        parameters: params,
    });
};


export const getFinancialSummary = async (period: 'daily' | 'monthly'): Promise<FinancialSummary> => {
    return await fetchFromGAS<FinancialSummary>({
        action_type: 'GET_FINANCIAL_SUMMARY',
        parameters: { period },
    });
};

export const getMonthlyTenants = async (): Promise<MonthlyTenant[]> => {
    return await fetchFromGAS<MonthlyTenant[]>({ action_type: 'GET_MONTHLY_TENANTS' });
};

export const getEmployees = async (): Promise<Employee[]> => {
  return await fetchFromGAS<Employee[]>({ action_type: 'GET_EMPLOYEE_MANAGEMENT' });
};

export const addExpense = async (params: AddExpenseParams): Promise<AddExpenseResponse> => {
    return await fetchFromGAS<AddExpenseResponse>({
        action_type: 'ADD_EXPENSE',
        parameters: params,
    });
};

export const exportDataToSheet = async (reportType: string, data: any): Promise<ExportDataResponse> => {
    return await fetchFromGAS<ExportDataResponse>({
        action_type: 'EXPORT_DATA',
        parameters: {
            report_type: reportType,
            data_to_export: data
        },
    });
};
