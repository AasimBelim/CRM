export const checkEmailFormat = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Create date formatter function
export const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, options);
}

export const limitString = (input: string, maxLength: number = 50): string => {
    if (input === null || input === undefined || input === '') {
        return '';
    }
    if (input.length <= maxLength) {
        return input;
    }
    return input.substring(0, maxLength) + '...';
}

// Format number with thousand separators and decimal places
export const formatNumber = (value: number | string, decimals: number = 2): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numValue)) {
        return '0.00';
    }
    
    return numValue.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}