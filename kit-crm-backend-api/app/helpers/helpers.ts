import crypto from 'crypto';

export const strToMd5 = (str: string): string => {
    return crypto.createHash('md5').update(str).digest('hex');
}

export const verifyEmailFormat = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
