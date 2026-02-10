'use client';

import { motion } from 'framer-motion';
import { ExternalLink, Star } from 'lucide-react';

interface PositiveResultProps {
    rating: number;
    googleReviewUrl: string;
    tripadvisorUrl?: string | null;
    primaryColor: string;
    accentColor: string;
    translations: {
        title: string;
        subtitle: string;
        shareMessage: string;
        googleButton: string;
        tripadvisorButton: string;
    };
}

export function PositiveResult({
    rating,
    googleReviewUrl,
    tripadvisorUrl,
    primaryColor,
    accentColor,
    translations: t,
}: PositiveResultProps) {
    const handleGoogleClick = () => {
        console.log('Redirecting to Google Reviews');
        window.open(googleReviewUrl, '_blank', 'noopener,noreferrer');
    };

    const handleTripadvisorClick = () => {
        if (tripadvisorUrl) {
            console.log('Redirecting to TripAdvisor');
            window.open(tripadvisorUrl, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <div className="text-center">
            {/* Celebration animation */}
            <motion.div
                className="mb-6"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                    delay: 0.1
                }}
            >
                <div
                    className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
                    style={{
                        background: `linear-gradient(135deg, ${accentColor}30, ${primaryColor}20)`,
                    }}
                >
                    <div className="flex gap-0.5">
                        {[...Array(rating)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + i * 0.1 }}
                            >
                                <Star
                                    size={16}
                                    fill={accentColor}
                                    stroke={accentColor}
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
                transition={{ delay: 0.2 }}
            >
                {t.title}
            </motion.h2>

            {/* Subtitle */}
            <motion.p
                className="text-sm opacity-70 mb-6"
                style={{ color: primaryColor }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                {t.subtitle}
            </motion.p>

            {/* Share message */}
            <motion.p
                className="text-sm mb-6"
                style={{ color: primaryColor }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                {t.shareMessage}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                {/* Google Review Button */}
                <motion.button
                    onClick={handleGoogleClick}
                    className="w-full py-4 px-6 rounded-2xl font-medium text-white flex items-center justify-center gap-3 shadow-lg transition-all"
                    style={{
                        background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                    }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <GoogleIcon />
                    <span>{t.googleButton}</span>
                    <ExternalLink size={16} className="opacity-70" />
                </motion.button>

                {/* TripAdvisor Button */}
                {tripadvisorUrl && (
                    <motion.button
                        onClick={handleTripadvisorClick}
                        className="w-full py-4 px-6 rounded-2xl font-medium flex items-center justify-center gap-3 border-2 transition-all"
                        style={{
                            borderColor: `${primaryColor}40`,
                            color: primaryColor,
                        }}
                        whileHover={{
                            scale: 1.02,
                            y: -2,
                            backgroundColor: `${primaryColor}08`,
                        }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <TripAdvisorIcon color={primaryColor} />
                        <span>{t.tripadvisorButton}</span>
                        <ExternalLink size={16} className="opacity-70" />
                    </motion.button>
                )}
            </motion.div>
        </div>
    );
}

// Custom Google icon
function GoogleIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    );
}

// Custom TripAdvisor icon
function TripAdvisorIcon({ color }: { color: string }) {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill={color}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-9c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm8 0c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-4 0c0 1.66-1.34 3-3 3s-3-1.34-3-3h2c0 .55.45 1 1 1s1-.45 1-1-.45-1-1-1-1 .45-1 1h-2c0-1.66 1.34-3 3-3s3 1.34 3 3z" />
        </svg>
    );
}
