/**
 * Utility functions for time calculations
 */

/**
 * Extract timestamp from MongoDB ObjectId and format as "time ago" string
 * @param objectId - MongoDB ObjectId string
 * @returns Formatted time ago string (e.g., "2h", "3d", "1w")
 */
export const getTimeAgoFromObjectId = (objectId: string): string => {
    const date = getDateFromObjectId(objectId);
    return formatTimeAgo(date);
};

/**
 * Extract timestamp from MongoDB ObjectId
 * @param objectId - MongoDB ObjectId string
 * @returns Date object representing when the document was created
 */
export const getDateFromObjectId = (objectId: string): Date => {
    return new Date(parseInt(objectId.substring(0, 8), 16) * 1000);
};

/**
 * Format time difference in compact format
 * @param date - Date to compare against current time
 * @returns Compact time ago string (e.g., "2h", "3d", "1w")
 */
export const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);

    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInDays < 7) return `${diffInDays}d`;
    if (diffInWeeks < 4) return `${diffInWeeks}w`;
    return `${diffInMonths}mo`;
};
