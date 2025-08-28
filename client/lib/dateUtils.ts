// Utility functions for handling IST (India Standard Time) formatting

export const IST_TIMEZONE = "Asia/Kolkata";

/**
 * Formats a date to IST timezone with various options
 */
export const formatToIST = (
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {},
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  };

  return dateObj.toLocaleDateString("en-IN", defaultOptions);
};

/**
 * Formats a date to local timezone with time included
 */
export const formatToISTDateTime = (
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {},
): string => {
  let dateObj: Date;

  if (typeof date === "string") {
    // Parse the date normally
    dateObj = new Date(date);

    // For all database timestamps (string format), add offset to match desired display time
    // This ensures server timestamps show in desired timezone regardless of format
    const offsetMs = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    dateObj = new Date(dateObj.getTime() + offsetMs);
  } else {
    dateObj = date;
  }

  // Ensure we have a valid date
  if (isNaN(dateObj.getTime())) {
    return "Invalid Date";
  }

  try {
    const formatter = new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      ...options,
    });

    return formatter.format(dateObj);
  } catch (error) {
    console.warn("Error formatting date:", error);
    // Fallback formatting
    const day = dateObj.getDate();
    const month = dateObj.toLocaleString("en-IN", { month: "short" });
    const year = dateObj.getFullYear();
    let hours = dateObj.getHours();
    const minutes = dateObj.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
  }
};

/**
 * Formats a date to just the date part in IST (YYYY-MM-DD format)
 */
export const formatToISTDateOnly = (date: string | Date): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Convert to IST and extract date part
  const istDate = new Date(
    dateObj.toLocaleString("en-US", { timeZone: IST_TIMEZONE }),
  );

  return istDate.toISOString().split("T")[0];
};

/**
 * Gets current IST timestamp
 */
export const getCurrentISTTimestamp = (): string => {
  return new Date().toLocaleString("en-US", { timeZone: IST_TIMEZONE });
};

/**
 * Gets current date/time formatted in local timezone for display
 */
export const getCurrentISTDateTime = (): string => {
  return formatToISTDateTime(new Date());
};

/**
 * Checks if a date is overdue (past current IST time)
 */
export const isOverdue = (dueDate: string | Date): boolean => {
  const dueDateObj = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  const currentIST = new Date(getCurrentISTTimestamp());

  return dueDateObj < currentIST;
};

/**
 * Gets relative time in IST (e.g., "2 hours ago", "in 3 days")
 */
export const getRelativeTimeIST = (date: string | Date): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const currentIST = new Date(getCurrentISTTimestamp());

  const diffMs = currentIST.getTime() - dateObj.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60)
    return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;

  return formatToIST(dateObj);
};
