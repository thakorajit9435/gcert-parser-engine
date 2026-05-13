import { MIN_STANDARD, MAX_STANDARD } from '../constants';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

/**
 * Validate standard data before save.
 */
export function validateStandard(data: {
    number?: number;
    label?: string;
    labelGu?: string;
}): ValidationResult {
    const errors: string[] = [];

    if (data.number === undefined || data.number < MIN_STANDARD || data.number > MAX_STANDARD) {
        errors.push(`Standard number must be between ${MIN_STANDARD} and ${MAX_STANDARD}.`);
    }
    if (!data.label?.trim()) {
        errors.push('Standard label is required.');
    }
    if (!data.labelGu?.trim()) {
        errors.push('Standard Gujarati label is required.');
    }

    return { isValid: errors.length === 0, errors };
}

/**
 * Validate subject data before save.
 */
export function validateSubject(data: {
    standardId?: string;
    name?: string;
    nameGu?: string;
}): ValidationResult {
    const errors: string[] = [];

    if (!data.standardId?.trim()) {
        errors.push('Standard is required.');
    }
    if (!data.name?.trim()) {
        errors.push('Subject name is required.');
    }
    if (!data.nameGu?.trim()) {
        errors.push('Subject Gujarati name is required.');
    }

    return { isValid: errors.length === 0, errors };
}

/**
 * Validate chapter data before save.
 */
export function validateChapter(data: {
    subjectId?: string;
    standardId?: string;
    title?: string;
    titleGu?: string;
    videoUrl?: string;
}): ValidationResult {
    const errors: string[] = [];

    if (!data.subjectId?.trim()) {
        errors.push('Subject is required.');
    }
    if (!data.standardId?.trim()) {
        errors.push('Standard is required.');
    }
    if (!data.title?.trim()) {
        errors.push('Chapter title is required.');
    }
    if (!data.titleGu?.trim()) {
        errors.push('Chapter Gujarati title is required.');
    }
    if (data.videoUrl && !/^https?:\/\/.+/.test(data.videoUrl)) {
        errors.push('Video URL must be a valid HTTP/HTTPS URL.');
    }

    return { isValid: errors.length === 0, errors };
}

/**
 * Validate quiz data before save.
 */
export function validateQuiz(data: {
    chapterId?: string;
    title?: string;
    titleGu?: string;
    timeLimitSeconds?: number;
    passingScore?: number;
}): ValidationResult {
    const errors: string[] = [];

    if (!data.chapterId?.trim()) {
        errors.push('Chapter is required.');
    }
    if (!data.title?.trim()) {
        errors.push('Quiz title is required.');
    }
    if (!data.titleGu?.trim()) {
        errors.push('Quiz Gujarati title is required.');
    }
    if (data.timeLimitSeconds !== undefined && data.timeLimitSeconds < 30) {
        errors.push('Time limit must be at least 30 seconds.');
    }
    if (data.passingScore !== undefined && (data.passingScore < 0 || data.passingScore > 100)) {
        errors.push('Passing score must be between 0 and 100.');
    }

    return { isValid: errors.length === 0, errors };
}

/**
 * Validate question data before save.
 */
export function validateQuestion(data: {
    quizId?: string;
    questionText?: string;
    questionTextGu?: string;
    options?: Array<{ text?: string; textGu?: string }>;
    correctOptionId?: string;
    points?: number;
}): ValidationResult {
    const errors: string[] = [];

    if (!data.quizId?.trim()) {
        errors.push('Quiz is required.');
    }
    if (!data.questionText?.trim()) {
        errors.push('Question text is required.');
    }
    if (!data.questionTextGu?.trim()) {
        errors.push('Question Gujarati text is required.');
    }
    if (!data.options || data.options.length < 2) {
        errors.push('At least 2 options are required.');
    }
    if (data.options) {
        data.options.forEach((opt, idx) => {
            if (!opt.text?.trim()) {
                errors.push(`Option ${idx + 1} text is required.`);
            }
            if (!opt.textGu?.trim()) {
                errors.push(`Option ${idx + 1} Gujarati text is required.`);
            }
        });
    }
    if (!data.correctOptionId?.trim()) {
        errors.push('Correct option must be selected.');
    }
    if (data.points !== undefined && data.points < 1) {
        errors.push('Points must be at least 1.');
    }

    return { isValid: errors.length === 0, errors };
}

/**
 * Validate notification data before save.
 */
export function validateNotification(data: {
    title?: string;
    message?: string;
    targetType?: string;
    targetStandard?: number;
}): ValidationResult {
    const errors: string[] = [];

    if (!data.title?.trim()) {
        errors.push('Notification title is required.');
    }
    if (!data.message?.trim()) {
        errors.push('Notification message is required.');
    }
    if (!data.targetType) {
        errors.push('Target type is required.');
    }
    if (data.targetType === 'standard' && !data.targetStandard) {
        errors.push('Target standard is required for standard-specific notifications.');
    }

    return { isValid: errors.length === 0, errors };
}

/**
 * Validate phone number (Indian format).
 */
export function validatePhone(phone: string): ValidationResult {
    const errors: string[] = [];
    const cleaned = phone.replace(/\s/g, '');

    if (!/^(\+91)?[6-9]\d{9}$/.test(cleaned)) {
        errors.push('Please enter a valid Indian phone number.');
    }

    return { isValid: errors.length === 0, errors };
}
