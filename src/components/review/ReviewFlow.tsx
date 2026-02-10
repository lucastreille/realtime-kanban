'use client';

import { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { StarRating } from './StarRating';
import { PositiveResult } from './PositiveResult';
import { NegativeResult } from './NegativeResult';
import { FeedbackForm } from './FeedbackForm';
import { ThankYouScreen } from './ThankYouScreen';
import { getTranslations, type Language } from '@/lib/i18n';

// Demo business data - replace with API call later
const DEMO_BUSINESS = {
    name: "Le Petit Bistrot",
    logoUrl: null,
    primaryColor: "#8B7355",
    accentColor: "#C9A86C",
    googleReviewUrl: "https://g.page/r/demo/review",
    tripadvisorUrl: "https://www.tripadvisor.com/Restaurant_Review-demo",
};

type FlowStep = 'rating' | 'positive' | 'negative' | 'feedback' | 'thanks';

interface ReviewFlowProps {
    businessName?: string;
    logoUrl?: string | null;
    primaryColor?: string;
    accentColor?: string;
    googleReviewUrl?: string;
    tripadvisorUrl?: string | null;
    language?: Language;
}

export function ReviewFlow({
    businessName = DEMO_BUSINESS.name,
    logoUrl = DEMO_BUSINESS.logoUrl,
    primaryColor = DEMO_BUSINESS.primaryColor,
    accentColor = DEMO_BUSINESS.accentColor,
    googleReviewUrl = DEMO_BUSINESS.googleReviewUrl,
    tripadvisorUrl = DEMO_BUSINESS.tripadvisorUrl,
    language = 'fr',
}: ReviewFlowProps) {
    const [step, setStep] = useState<FlowStep>('rating');
    const [rating, setRating] = useState(0);
    const t = getTranslations(language);

    const handleRatingChange = (newRating: number) => {
        setRating(newRating);

        // Delay transition for animation
        setTimeout(() => {
            if (newRating >= 3) {
                setStep('positive');
            } else {
                setStep('negative');
            }
        }, 800);
    };

    const handleFeedbackSubmit = (feedback: { text: string; email?: string }) => {
        console.log('Feedback submitted:', { rating, ...feedback });
        // In production, send to API
        setStep('thanks');
    };

    const handleReviewAnyway = () => {
        // Track that user chose to review anyway despite low rating
        console.log('User chose to leave public review despite low rating');
    };

    const containerVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
        },
        exit: {
            opacity: 0,
            y: -20,
            transition: { duration: 0.3 }
        },
    };

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center p-6"
            style={{
                background: `linear-gradient(135deg, 
          ${primaryColor}08 0%, 
          ${accentColor}12 50%, 
          ${primaryColor}08 100%
        )`,
            }}
        >
            {/* Background decorative elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-20"
                    style={{ backgroundColor: accentColor }}
                />
                <div
                    className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-15"
                    style={{ backgroundColor: primaryColor }}
                />
            </div>

            {/* Main content card */}
            <motion.div
                className="relative w-full max-w-md"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
                {/* Glass card */}
                <div
                    className="relative backdrop-blur-xl rounded-3xl p-8 shadow-2xl border"
                    style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.85)',
                        borderColor: `${accentColor}30`,
                    }}
                >
                    {/* Logo / Business name header */}
                    <motion.div
                        className="text-center mb-8"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt={businessName}
                                className="h-16 mx-auto mb-4 object-contain"
                            />
                        ) : (
                            <div
                                className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-white font-serif text-2xl font-semibold"
                                style={{
                                    background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`
                                }}
                            >
                                {businessName.charAt(0)}
                            </div>
                        )}
                        <h1
                            className="text-xl font-serif font-semibold"
                            style={{ color: primaryColor }}
                        >
                            {businessName}
                        </h1>
                    </motion.div>

                    {/* Dynamic content based on step */}
                    <AnimatePresence mode="wait">
                        {step === 'rating' && (
                            <motion.div
                                key="rating"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="text-center"
                            >
                                <h2
                                    className="text-2xl font-serif font-medium mb-2"
                                    style={{ color: primaryColor }}
                                >
                                    {t.rating.title}
                                </h2>
                                <p
                                    className="text-sm mb-8 opacity-70"
                                    style={{ color: primaryColor }}
                                >
                                    {t.rating.subtitle}
                                </p>

                                <StarRating
                                    value={rating}
                                    onChange={handleRatingChange}
                                    primaryColor={accentColor}
                                    accentColor={primaryColor}
                                />

                                <p
                                    className="text-xs mt-6 opacity-50"
                                    style={{ color: primaryColor }}
                                >
                                    {t.rating.tapToRate}
                                </p>
                            </motion.div>
                        )}

                        {step === 'positive' && (
                            <motion.div
                                key="positive"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                <PositiveResult
                                    rating={rating}
                                    googleReviewUrl={googleReviewUrl}
                                    tripadvisorUrl={tripadvisorUrl}
                                    primaryColor={primaryColor}
                                    accentColor={accentColor}
                                    translations={t.positive}
                                />
                            </motion.div>
                        )}

                        {step === 'negative' && (
                            <motion.div
                                key="negative"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                <NegativeResult
                                    rating={rating}
                                    onFeedbackClick={() => setStep('feedback')}
                                    onReviewClick={handleReviewAnyway}
                                    googleReviewUrl={googleReviewUrl}
                                    tripadvisorUrl={tripadvisorUrl}
                                    primaryColor={primaryColor}
                                    accentColor={accentColor}
                                    translations={t.negative}
                                />
                            </motion.div>
                        )}

                        {step === 'feedback' && (
                            <motion.div
                                key="feedback"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                <FeedbackForm
                                    onSubmit={handleFeedbackSubmit}
                                    primaryColor={primaryColor}
                                    accentColor={accentColor}
                                    translations={t.feedback}
                                />
                            </motion.div>
                        )}

                        {step === 'thanks' && (
                            <motion.div
                                key="thanks"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                <ThankYouScreen
                                    primaryColor={primaryColor}
                                    accentColor={accentColor}
                                    translations={t.thanks}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <motion.p
                    className="text-center text-xs mt-6 opacity-40"
                    style={{ color: primaryColor }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    transition={{ delay: 0.8 }}
                >
                    {t.common.poweredBy} <span className="font-medium">ReviewFunnel</span>
                </motion.p>
            </motion.div>
        </div>
    );
}
