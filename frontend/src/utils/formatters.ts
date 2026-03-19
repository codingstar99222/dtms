// frontend/src/utils/formatters.ts
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatHours = (hours: number): string => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

// For displaying date strings (YYYY-MM-DD) - NO timezone conversion
export const formatDate = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-');
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${months[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
};

// For Date objects (rare cases)
export const formatDateObject = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

// For display with time (timestamps from backend)
export const formatDateTime = (utcString: string): string => {
  return new Date(utcString).toLocaleString(); // Local timezone
};

export const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`;
};

// For forms - convert Date to YYYY-MM-DD
export const dateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
