import React, { useState, useMemo, useCallback } from 'react';
import { RoomStatus, PreBooking, Employee, MonthlyTenant, FinancialSummary, PendingBooking } from '../types';
import { DoorOpen, Calendar, Users, LayoutGrid, ChevronLeft, ChevronRight, BedSingle, BedDouble, CheckCircle, XCircle, DollarSign, Briefcase, Wallet, Contact, FileSpreadsheet, TrendingUp, TrendingDown, Scale, Download, UserCheck, ArrowRight, AlertTriangle, Info } from 'lucide-react';

// --- Action Prop Type ---
type ExecuteAction = (action: { action_type: string, parameters: any }) => void;

// --- Main Menu Block ---
export const MainMenuBlock: React.FC<{ onExecuteAction: ExecuteAction; }> = ({ onExecuteAction }) => {
    const handleActionClick = (actionType: string, parameters: any = {}) => {
        onExecuteAction({ action_type: actionType, parameters });
    };

    const ActionButton: React.FC<{label: string; action: string; params?: any; className: string; icon: React.ElementType;}> =
        ({ label, action, params, className, icon: Icon }) => (
        <button
            onClick={() => handleActionClick(action, params)}
            className={`flex items-center p-3 text-white rounded-lg shadow-lg transition duration-200 transform hover:scale-[1.03] w-full font-semibold text-left ${className}`}
        >
            <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
            <span>{label}</span>
        </button>
    );

    return (
        <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-xl border-t-4 border-indigo-500 w-full">
            <h3 className="text-lg font-extrabold mb-4 text-indigo-700 dark:text-indigo-300 flex items-center">
                <LayoutGrid className="w-5 h-5 mr-2 text-indigo-500" />
                เมนูหลัก
            </h3>
            <div className="grid grid-cols-2 gap-3">
                 <ActionButton label="สถานะห้อง" action="GET_STATUS" className="bg-teal-500 hover:bg-teal-600" icon={DoorOpen} />
                 <ActionButton label="ปฏิทิน" action="GET_BOOKING_CALENDAR" className="bg-sky-500 hover:bg-sky-600" icon={Calendar} />
                 <ActionButton label="รายเดือน" action="GET_MONTHLY_TENANTS" className="bg-blue-500 hover:bg-blue-600" icon={Contact} />
                 <ActionButton label="พนักงาน" action="GET_EMPLOYEE_MANAGEMENT" className="bg-purple-500 hover:bg-purple-600" icon={Users} />
                 <ActionButton label="สรุปรายวัน" action="GET_FINANCIAL_SUMMARY" params={{ period: 'daily' }} className="bg-amber-500 hover:bg-amber-600" icon={FileSpreadsheet} />
                 <ActionButton label="สรุปรายเดือน" action="GET_FINANCIAL_SUMMARY" params={{ period: 'monthly' }} className="bg-rose-500 hover:bg-rose-600" icon={TrendingUp} />
            </div>
        </div>
    );
};


// --- Export Button ---
const ExportButton: React.FC<{ onExecuteAction: ExecuteAction, reportType: string, params?: any }> = ({ onExecuteAction, reportType, params = {} }) => (
    <button
        onClick={() => onExecuteAction({
            action_type: 'EXPORT_DATA',
            parameters: { report_type: reportType, params }
        })}
        className="absolute top-2 right-2 p-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-all duration-200 transform hover:scale-110"
        title="Export to Sheet"
    >
        <Download className="w-4 h-4" />
    </button>
);


// --- Room Status Block ---
interface RoomStatusBlockProps {
    roomStatuses: RoomStatus;
    onExecuteAction: ExecuteAction;
}
export const RoomStatusBlock = React.memo<RoomStatusBlockProps>(({ roomStatuses, onExecuteAction }) => (
  <div className="relative p-3 bg-white dark:bg-gray-800 rounded-xl shadow-xl border-t-4 border-teal-500 w-full">
    <h3 className="text-lg font-extrabold mb-3 text-teal-700 dark:text-teal-300 flex items-center">
      <DoorOpen className="w-5 h-5 mr-2 text-teal-500" />
      สรุปสถานะห้องพัก
    </h3>
    <ExportButton onExecuteAction={onExecuteAction} reportType="ROOM_STATUS" />
    <div className="grid grid-cols-2 gap-3 text-xs">
      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg flex justify-between items-center shadow-md border border-green-200 dark:border-green-700">
        <p className="font-semibold text-green-700 dark:text-green-300 flex items-center">
          <CheckCircle className="w-4 h-4 mr-1 text-green-500" /> ห้องว่าง
        </p>
        <p className="text-2xl font-black text-green-600 dark:text-green-400">{roomStatuses.vacant}</p>
      </div>
      <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg flex justify-between items-center shadow-md border border-red-200 dark:border-red-700">
        <p className="font-semibold text-red-700 dark:text-red-300 flex items-center">
          <XCircle className="w-4 h-4 mr-1 text-red-500" /> ไม่ว่าง
        </p>
        <p className="text-2xl font-black text-red-600 dark:text-red-400">{roomStatuses.occupied}</p>
      </div>
    </div>
    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2 text-right font-medium">รวมทั้งหมด {roomStatuses.total} ห้อง</p>
  </div>
));


// --- Booking Calendar Block (Redesigned) ---
interface BookingCalendarBlockProps {
    bookings: PreBooking[];
    totalRooms: { standard: number; twin: number; total: number; };
}
export const BookingCalendarBlock = React.memo<BookingCalendarBlockProps>(({ bookings, totalRooms }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const calendarData = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const daysInMonth = [];
        const firstDayOfWeek = firstDayOfMonth.getDay();

        // Add blank days for the start of the month
        for (let i = 0; i < firstDayOfWeek; i++) {
            daysInMonth.push(null);
        }

        // Add days of the month
        for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
            daysInMonth.push(new Date(year, month, i));
        }

        return daysInMonth;
    }, [currentDate]);

    const getDayStatus = useCallback((date: Date | null) => {
        if (!date) return 'empty';
        const dateString = date.toISOString().slice(0, 10);
        
        const bookingsForDay = bookings.filter(b => b.dates.includes(dateString)).length;

        if (bookingsForDay === 0) return 'available';
        if (bookingsForDay >= totalRooms.total) return 'full';
        return 'partial';
    }, [bookings, totalRooms.total]);
    
    const changeMonth = (offset: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + offset);
            return newDate;
        });
    };

    const today = new Date();
    const weekdays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

    return (
        <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-xl border-t-4 border-sky-500 w-full max-w-sm mx-auto">
            <div className="flex justify-between items-center mb-2">
                <button onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="เดือนก่อนหน้า">
                    <ChevronLeft className="w-5 h-5 text-sky-600 dark:text-sky-300" />
                </button>
                <h3 className="font-bold text-sm text-sky-800 dark:text-sky-200">
                    {currentDate.toLocaleString('th-TH', { month: 'long', year: 'numeric' })}
                </h3>
                <button onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="เดือนถัดไป">
                    <ChevronRight className="w-5 h-5 text-sky-600 dark:text-sky-300" />
                </button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                {weekdays.map(day => <div key={day}>{day}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {calendarData.map((date, index) => {
                    if (!date) return <div key={`empty-${index}`}></div>;

                    const status = getDayStatus(date);
                    const isToday = date.toDateString() === today.toDateString();

                    let statusClasses = '';
                    switch (status) {
                        case 'available': statusClasses = 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'; break;
                        case 'partial': statusClasses = 'bg-yellow-100 dark:bg-yellow-800/40 text-yellow-800 dark:text-yellow-300'; break;
                        case 'full': statusClasses = 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'; break;
                    }

                    const todayClasses = isToday ? 'ring-2 ring-sky-500' : '';

                    return (
                        <div key={date.toISOString()} className={`flex items-center justify-center h-7 w-full rounded-full text-xs font-semibold transition-colors ${statusClasses} ${todayClasses}`}>
                            {date.getDate()}
                        </div>
                    );
                })}
            </div>
             <div className="flex justify-center items-center space-x-3 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300">
                <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-green-200 dark:bg-green-700 mr-1"></span>ว่าง</span>
                <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-yellow-200 dark:bg-yellow-600 mr-1"></span>ว่างบางส่วน</span>
                <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-red-200 dark:bg-red-700 mr-1"></span>เต็ม</span>
            </div>
        </div>
    );
});


// --- Financial Summary Block ---
interface FinancialSummaryBlockProps {
    summary: FinancialSummary;
    onExecuteAction: ExecuteAction;
}
export const FinancialSummaryBlock = React.memo<FinancialSummaryBlockProps>(({ summary, onExecuteAction }) => {
    const periodText = summary.period === 'daily' ? 'ประจำวัน' : 'ประจำเดือน';
    const profitColor = summary.net_profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400';
    const profitBgColor = summary.net_profit >= 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700';

    const StatCard: React.FC<{icon: React.ElementType, title: string, value: string, color: string}> = ({icon: Icon, title, value, color}) => (
        <div className={`flex items-center p-3 rounded-lg bg-${color}-50 dark:bg-${color}-900/20 border border-${color}-200 dark:border-${color}-700 shadow-sm`}>
            <div className={`p-2 rounded-full bg-${color}-100 dark:bg-${color}-800/30 text-${color}-600 dark:text-${color}-300 mr-3`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className={`text-xs font-semibold text-${color}-800 dark:text-${color}-200`}>{title}</p>
                <p className={`text-lg font-black text-${color}-600 dark:text-${color}-400`}>฿{value}</p>
            </div>
        </div>
    );

    return (
        <div className="relative p-3 bg-white dark:bg-gray-800 rounded-xl shadow-xl border-t-4 border-amber-500 w-full">
            <h3 className="text-lg font-extrabold mb-3 text-amber-700 dark:text-amber-300 flex items-center">
                <FileSpreadsheet className="w-5 h-5 mr-2 text-amber-500" />
                สรุปการเงิน{periodText}
            </h3>
            <ExportButton onExecuteAction={onExecuteAction} reportType="FINANCIAL_SUMMARY" params={{ period: summary.period }}/>

            <div className="space-y-3">
                <StatCard icon={TrendingUp} title="รายรับรวม" value={summary.revenue.total.toLocaleString('th-TH')} color="green" />
                <div className="pl-8 text-xs space-y-1">
                     <p className="text-gray-500 dark:text-gray-400">ห้องพักรายวัน: <span className="font-semibold text-gray-700 dark:text-gray-200">฿{summary.revenue.daily_rooms.toLocaleString('th-TH')}</span></p>
                     <p className="text-gray-500 dark:text-gray-400">ห้องพักรายเดือน: <span className="font-semibold text-gray-700 dark:text-gray-200">฿{summary.revenue.monthly_tenants.toLocaleString('th-TH')}</span></p>
                </div>

                <StatCard icon={TrendingDown} title="รายจ่ายรวม" value={summary.expenses.total.toLocaleString('th-TH')} color="red" />
                 <div className="pl-8 text-xs space-y-1">
                     <p className="text-gray-500 dark:text-gray-400">รายจ่ายทั่วไป: <span className="font-semibold text-gray-700 dark:text-gray-200">฿{summary.expenses.general.toLocaleString('th-TH')}</span></p>
                     <p className="text-gray-500 dark:text-gray-400">เงินเดือนพนักงาน: <span className="font-semibold text-gray-700 dark:text-gray-200">฿{summary.expenses.salaries.toLocaleString('th-TH')}</span></p>
                </div>
            </div>

            <div className={`mt-4 p-3 rounded-lg text-center shadow-inner border ${profitBgColor}`}>
                <p className={`text-sm font-bold ${profitColor} flex items-center justify-center`}>
                    <Scale className="w-4 h-4 mr-2" /> กำไรสุทธิ
                </p>
                <p className={`text-3xl font-black mt-1 ${profitColor}`}>
                    ฿ {summary.net_profit.toLocaleString('th-TH')}
                </p>
            </div>
        </div>
    );
});

// --- Monthly Tenant Block ---
interface MonthlyTenantBlockProps {
    tenants: MonthlyTenant[];
    onExecuteAction: ExecuteAction;
}
export const MonthlyTenantBlock = React.memo<MonthlyTenantBlockProps>(({ tenants = [], onExecuteAction }) => {
    const totalRent = useMemo(() => tenants.reduce((sum, t) => sum + t.rent_amount, 0), [tenants]);

    return (
        <div className="relative p-3 bg-white dark:bg-gray-800 rounded-xl shadow-xl border-t-4 border-blue-500 w-full">
            <h3 className="text-lg font-extrabold mb-3 text-blue-700 dark:text-blue-300 flex items-center">
                <Contact className="w-5 h-5 mr-2 text-blue-500" />
                ทะเบียนผู้เช่ารายเดือน
            </h3>
            <ExportButton onExecuteAction={onExecuteAction} reportType="MONTHLY_TENANT_MANAGEMENT" />
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {tenants.map(tenant => (
                    <div key={tenant.id} className="flex items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                        <div className="flex-grow">
                            <p className="font-bold text-sm text-gray-800 dark:text-gray-100">{tenant.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">ห้อง: <span className="font-semibold">{tenant.room_id}</span></p>
                        </div>
                        <div className="flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400">
                            <Wallet className="w-3.5 h-3.5 mr-1.5" />
                            <span>฿{tenant.rent_amount.toLocaleString('th-TH')}/เดือน</span>
                        </div>
                    </div>
                ))}
            </div>
             <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 text-right">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                    จำนวนผู้เช่า: <span className="font-bold text-blue-600 dark:text-blue-400">{tenants.length}</span> คน
                </p>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                    รายรับต่อเดือน: <span className="font-bold text-blue-600 dark:text-blue-400">฿{totalRent.toLocaleString('th-TH')}</span>
                </p>
            </div>
        </div>
    );
});

// --- Employee Management Block ---
interface EmployeeManagementBlockProps {
    employees: Employee[];
    onExecuteAction: ExecuteAction;
}
export const EmployeeManagementBlock = React.memo<EmployeeManagementBlockProps>(({ employees = [], onExecuteAction }) => {
    const totalSalary = useMemo(() => employees.reduce((sum, emp) => sum + emp.salary, 0), [employees]);

    return (
        <div className="relative p-3 bg-white dark:bg-gray-800 rounded-xl shadow-xl border-t-4 border-purple-500 w-full">
            <h3 className="text-lg font-extrabold mb-3 text-purple-700 dark:text-purple-300 flex items-center">
                <Users className="w-5 h-5 mr-2 text-purple-500" />
                ทะเบียนพนักงาน
            </h3>
            <ExportButton onExecuteAction={onExecuteAction} reportType="EMPLOYEE_MANAGEMENT" />
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {employees.map(employee => (
                    <div key={employee.id} className="flex items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                        <div className="flex-grow">
                            <p className="font-bold text-sm text-gray-800 dark:text-gray-100">{employee.name}</p>
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                <Briefcase className="w-3 h-3 mr-1.5" />
                                <span>{employee.position}</span>
                            </div>
                        </div>
                        <div className="flex items-center text-sm font-semibold text-green-600 dark:text-green-400">
                            <Wallet className="w-3.5 h-3.5 mr-1.5" />
                            <span>฿{employee.salary.toLocaleString('th-TH')}</span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 text-right">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                    จำนวนพนักงานทั้งหมด: <span className="font-bold text-purple-600 dark:text-purple-400">{employees.length}</span> คน
                </p>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                    ค่าใช้จ่ายเงินเดือนรวม: <span className="font-bold text-purple-600 dark:text-purple-400">฿{totalSalary.toLocaleString('th-TH')}</span>
                </p>
            </div>
        </div>
    );
});

// --- Report Link Block ---
interface ReportLinkBlockProps {
    url: string;
    reportType: string;
}
export const ReportLinkBlock = React.memo<ReportLinkBlockProps>(({ url, reportType }) => {
    const reportTitles: { [key: string]: string } = {
        'FINANCIAL_SUMMARY': 'รายงานสรุปการเงิน',
        'ROOM_STATUS': 'รายงานสถานะห้องพัก',
        'EMPLOYEE_MANAGEMENT': 'รายงานข้อมูลพนักงาน',
        'MONTHLY_TENANT_MANAGEMENT': 'รายงานผู้เช่ารายเดือน'
    };
    const title = reportTitles[reportType] || 'รายงาน';

    return (
        <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-xl border-t-4 border-green-500 w-full">
            <h3 className="text-lg font-extrabold mb-2 text-green-700 dark:text-green-300 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                รายงานพร้อมใช้งาน
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                {title} ของคุณถูกสร้างเรียบร้อยแล้ว
            </p>
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center p-2 bg-green-500 text-white rounded-lg shadow-lg hover:bg-green-600 transition duration-200 transform hover:scale-[1.03] font-semibold"
            >
                <FileSpreadsheet className="w-5 h-5 mr-2" />
                เปิดรายงาน (Google Sheet)
            </a>
        </div>
    );
});

// --- Booking Confirmation Block ---
interface BookingConfirmationBlockProps {
    booking: PreBooking;
}
export const BookingConfirmationBlock: React.FC<BookingConfirmationBlockProps> = ({ booking }) => {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };
    const roomTypeDisplay = booking.room_type === 'Standard' 
        ? <><BedSingle className="w-4 h-4 mr-1.5"/>Standard</>
        : <><BedDouble className="w-4 h-4 mr-1.5"/>Standard Twin</>;

    return (
        <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-xl border-t-4 border-green-500 w-full">
            <h3 className="text-lg font-extrabold mb-3 text-green-700 dark:text-green-300 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                ยืนยันการจอง
            </h3>
            <div className="space-y-2 text-sm">
                <div className="flex items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <UserCheck className="w-4 h-4 mr-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">ชื่อผู้เข้าพัก</p>
                        <p className="font-bold text-gray-800 dark:text-gray-100">{booking.guest_name}</p>
                    </div>
                </div>
                 <div className="flex items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <DoorOpen className="w-4 h-4 mr-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">ประเภทห้อง / หมายเลข</p>
                        <p className="font-bold text-gray-800 dark:text-gray-100 flex items-center">{roomTypeDisplay} / {booking.room_id}</p>
                    </div>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="text-center">
                         <p className="text-xs text-gray-500 dark:text-gray-400">เช็คอิน</p>
                         <p className="font-bold text-gray-800 dark:text-gray-100">{formatDate(booking.start_date)}</p>
                    </div>
                     <ArrowRight className="w-5 h-5 text-green-500" />
                     <div className="text-center">
                         <p className="text-xs text-gray-500 dark:text-gray-400">เช็คเอาท์</p>
                         <p className="font-bold text-gray-800 dark:text-gray-100">{formatDate(booking.end_date)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Booking Pending Payment Block ---
interface BookingPendingPaymentBlockProps {
    booking: PendingBooking;
}
export const BookingPendingPaymentBlock: React.FC<BookingPendingPaymentBlockProps> = ({ booking }) => {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('th-TH', {
            day: 'numeric', month: 'short', year: 'numeric',
        });
    };
    const roomTypeDisplay = booking.room_type === 'Standard'
        ? <><BedSingle className="w-4 h-4 mr-1.5"/>Standard</>
        : <><BedDouble className="w-4 h-4 mr-1.5"/>Standard Twin</>;

    return (
        <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-xl border-t-4 border-amber-500 w-full">
            <h3 className="text-lg font-extrabold mb-3 text-amber-700 dark:text-amber-300 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
                รอการชำระเงินมัดจำ
            </h3>
            
            <div className="space-y-2 text-sm">
                 <div className="flex items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <UserCheck className="w-4 h-4 mr-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">ชื่อผู้เข้าพัก</p>
                        <p className="font-bold text-gray-800 dark:text-gray-100">{booking.guest_name}</p>
                    </div>
                </div>
                 <div className="flex items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <DoorOpen className="w-4 h-4 mr-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">ประเภทห้อง / หมายเลข</p>
                        <p className="font-bold text-gray-800 dark:text-gray-100 flex items-center">{roomTypeDisplay} / {booking.room_id}</p>
                    </div>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="text-center">
                         <p className="text-xs text-gray-500 dark:text-gray-400">เช็คอิน</p>
                         <p className="font-bold text-gray-800 dark:text-gray-100">{formatDate(booking.start_date)}</p>
                    </div>
                     <ArrowRight className="w-5 h-5 text-amber-500" />
                     <div className="text-center">
                         <p className="text-xs text-gray-500 dark:text-gray-400">เช็คเอาท์</p>
                         <p className="font-bold text-gray-800 dark:text-gray-100">{formatDate(booking.end_date)}</p>
                    </div>
                </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-300">ค่าห้องพักทั้งหมด</span>
                    <span className="font-bold text-gray-800 dark:text-gray-100">฿{booking.total_cost.toLocaleString('th-TH')}</span>
                </div>
                <div className="flex justify-between items-center text-lg p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                    <span className="font-bold text-amber-700 dark:text-amber-300">ค่ามัดจำ (30%)</span>
                    <span className="font-black text-amber-600 dark:text-amber-400">฿{booking.deposit_amount.toLocaleString('th-TH')}</span>
                </div>
            </div>

             <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-start">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mr-2 mt-0.5" />
                <p className="text-xs text-blue-800 dark:text-blue-200">
                    การจองจะสมบูรณ์เมื่อชำระค่ามัดจำเรียบร้อยแล้ว กรุณา<b>อัปโหลดสลิป</b>ในแชทนี้เพื่อยืนยัน
                </p>
            </div>
        </div>
    );
};
