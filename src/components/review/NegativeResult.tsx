'use client';

import { motion } from 'framer-motion';
import { MessageSquare, ExternalLink, Star } from 'lucide-react';

interface NegativeResultProps {
    rating: number;
    onFeedbackClick: () => void;
    onReviewClick: () => void;
    googleReviewUrl: string;
    tripadvisorUrl?: string | null;
    primaryColor: string;
    accentColor: string;
    translations: {
        title: string;
        subtitle: string;
        feedbackOption: string;
        reviewOption: string;
        or: string;
    };
}

export function NegativeResult({
    rating,
    onFeedbackClick,
    onReviewClick,
    googleReviewUrl,
    tripadvisorUrl,
    primaryColor,
    accentColor,
    translations: t,
}: NegativeResultProps) {
    const handleReviewClick = (platform: 'google' | 'tripadvisor') => {
        onReviewClick();
        const url = platform === 'google' ? googleReviewUrl : tripadvisorUrl;
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <div className="text-center">
            {/* Empathetic icon */}
            <motion.div
                className="mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                }}
            >
                <div
                    className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
                    style={{
                        background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}10)`,
                    }}
                >
                    <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + i * 0.08 }}
                            >
                                <Star
                                    size={14}
                                    fill={i < rating ? accentColor : 'transparent'}
                                    stroke={i < rating ? accentColor : `${primaryColor}40`}
                                />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Title */}
            <motion.h2
                className="text-2xl font-serif font-semibold mb-2"
                style={{ color: primaryColor }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
            >
                {t.title}
            </motion.h2>

            {/* Subtitle */}
            <motion.p
                className="text-sm opacity-70 mb-8"
                style={{ color: primaryColor }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
            >
                {t.subtitle}
            </motion.p>

            {/* Options */}
            <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
            >
                {/* Option A: Private Feedback (Primary) */}
                <motion.button
                    onClick={onFeedbackClick}
                    className="w-full py-4 px-6 rounded-2xl font-medium text-white flex items-center justify-center gap-3 shadow-lg"
                    style={{
                        background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                    }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <MessageSquare size={20} />
                    <span>{t.feedbackOption}</span>
                </motion.button>

                {/* Divider */}
                <div className="flex items-center gap-4">
                    <div
                        className="flex-1 h-px"
                        style={{ backgroundColor: `${primaryColor}20` }}
                    />
                    <span
                        className="text-xs uppercase tracking-wider opacity-50"
                        style={{ color: primaryColor }}
                    >
                        {t.or}
                    </span>
                    <div
                        className="flex-1 h-px"
                        style={{ backgroundColor: `${primaryColor}20` }}
                    />
                </div>

                {/* Option B: Public Review Anyway */}
                <div className="space-y-2">
                    <p
                        className="text-xs opacity-60 mb-2"
                        style={{ color: primaryColor }}
                    >
                        {t.reviewOption}
                    </p>

                    <div className="flex gap-2">
                        {/* Google */}
                        <motion.button
                            onClick={() => handleReviewClick('google')}
                            className="flex-1 py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 border transition-all"
                            style={{
                                borderColor: `${primaryColor}30`,
                                color: primaryColor,
                            }}
                            whileHover={{
                                scale: 1.02,
                                backgroundColor: `${primaryColor}08`,
                            }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <GoogleIcon size={16} />
                            <span>Google</span>
                            <ExternalLink size={12} className="opacity-50" />
                        </motion.button>

                        {/* TripAdvisor */}
                        {tripadvisorUrl && (
                            <motion.button
                                onClick={() => handleReviewClick('tripadvisor')}
                                className="flex-1 py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 border transition-all"
                                style={{
                                    borderColor: `${primaryColor}30`,
                                    color: primaryColor,
                                }}
                                whileHover={{
                                    scale: 1.02,
                                    backgroundColor: `${primaryColor}08`,
                                }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <TripAdvisorIcon size={16} color={primaryColor} />
                                <span>TripAdvisor</span>
                                <ExternalLink size={12} className="opacity-50" />
                            </motion.button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// Custom Google icon
function GoogleIcon({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    );
}

// Custom TripAdvisor icon
function TripAdvisorIcon({ size = 20, color }: { size?: number; color: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-9c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm8 0c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z" />
        </svg>
    );
}
