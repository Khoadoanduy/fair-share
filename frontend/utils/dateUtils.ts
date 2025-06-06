/**
 * Utility functions for date formatting and calculations
 */

/**
 * Format a date to a relative time string (e.g., "Today", "Tomorrow", "In 5 days")
 * or to a localized date string if it's further in the future or past
 * 
 * @param dateString - The date to format (string, number, or Date)
 * @returns Formatted date string
 */
export const formatRelativeDate = (dateString: string | number | Date): string => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  const now = new Date();
  
  // Set hours, minutes, seconds, and milliseconds to 0 for both dates to compare just the days
  const dateWithoutTime = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowWithoutTime = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffInDays = Math.floor(
    (dateWithoutTime.getTime() - nowWithoutTime.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffInDays < 0) {
    // Past dates
    const absDiff = Math.abs(diffInDays);
    if (absDiff === 0) return 'Today';
    if (absDiff === 1) return 'Yesterday';
    if (absDiff < 7) return `${absDiff} days ago`;
    if (absDiff < 30) return `${Math.floor(absDiff / 7)} weeks ago`;
  } else if (diffInDays >= 0) {
    // Future dates (including today)
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Tomorrow';
    if (diffInDays < 7) return `In ${diffInDays} days`;
    if (diffInDays < 30) return `In ${Math.floor(diffInDays / 7)} weeks`;
  }

  // For dates more than a month away, use a standard date format
  return date.toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

/**
 * Format a date to display the payment date with additional context
 * 
 * @param dateString - The date to format (string, number, or Date)
 * @returns Formatted payment date string with context
 */
export const formatPaymentDate = (dateString: string | number | Date): string => {
  if (!dateString) return 'No payment scheduled';
  
  const relativeDate = formatRelativeDate(dateString);
  const date = new Date(dateString);
  
  // Format the absolute date
  const absoluteDate = date.toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
  
  // For "Today" and "Tomorrow", add the absolute date for clarity
  if (relativeDate === 'Today' || relativeDate === 'Tomorrow') {
    return `${relativeDate} (${absoluteDate})`;
  }
  
  return relativeDate;
};

/**
 * Calculate days remaining until a given date
 * 
 * @param dateString - The target date (string, number, or Date)
 * @returns Number of days remaining (negative if date is in the past)
 */
export const getDaysRemaining = (dateString: string | number | Date): number => {
  if (!dateString) return 0;
  
  const targetDate = new Date(dateString);
  const now = new Date();
  
  // Set hours, minutes, seconds, and milliseconds to 0 for both dates
  const targetWithoutTime = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const nowWithoutTime = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = targetWithoutTime.getTime() - nowWithoutTime.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Calculate the next payment date based on the cycle and cycle days
 * 
 * @param cycle - The payment cycle (e.g., 'weekly', 'monthly', 'yearly')
 * @param cycleDays - The number of days in the cycle
 * @returns The next payment date
 */
export const calculateNextPaymentDate = (
  startDate: Date | string | null = null, 
  cycle: string, 
  cycleDays: number
): Date => {
  const today = startDate ? new Date(startDate) : new Date();
  const nextPaymentDate = new Date(today);
  
  // Add the appropriate number of days based on the cycle
  nextPaymentDate.setDate(today.getDate() + cycleDays);
  
  return nextPaymentDate;
};