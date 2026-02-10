'use client';

import { motion } from 'framer-motion';
import { Heart, CheckCircle } from 'lucide-react';

interface ThankYouScreenProps {
    primaryColor: string;
    accentColor: string;
    translations: {
        title: string;
        subtitle: string;
        message: string;
    };
}

export function ThankYouScreen({
    primaryColor,
    accentColor,
    translations: t,
}: ThankYouScreenProps) {
    return (
        <div className="text-center py-4">
            {/* Success animation */}
            <motion.div
                className="mb-6"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                }}
            >
                <div
                    className="w-20 h-20 mx-auto rounded-full flex items-center justify-center relative"
                    style={{
                        background: `linear-gradient(135deg, ${accentColor}30, ${primaryColor}20)`,
                    }}
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
                    >
                        <CheckCircle
                            size={40}
                            style={{ color: accentColor }}
                            strokeWidth={1.5}
                        />
                    </motion.div>

                    {/* Floating hearts */}
                    {[...Array(3)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute"
                            initial={{
                                opacity: 0,
                                scale: 0,
                                x: 0,
                                y: 0,
                            }}
                            animate={{
                                opacity: [0, 1, 0],
                                scale: [0.5, 1, 0.5],
                                x: Math.cos((i * 120) * Math.PI / 180) * 50,
                                y: Math.sin((i * 120) * Math.PI / 180) * 50 - 20,
                            }}
                            transition={{
                                delay: 0.5 + i * 0.15,
                                duration: 1.5,
                                ease: 'easeOut',
                            }}
                        >
                            <Heart
                                size={16}
                                fill={accentColor}
                                style={{ color: accentColor }}
                            />
                        </motion.div>
                    ))}
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
                className="text-sm opacity-70 mb-4"
                style={{ color: primaryColor }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                {t.subtitle}
            </motion.p>

            {/* Message */}
            <motion.p
                className="text-sm opacity-60"
                style={{ color: primaryColor }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                {t.message}
            </motion.p>
        </div>
    );
}
