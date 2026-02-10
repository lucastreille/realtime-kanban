'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';

interface FeedbackFormProps {
    onSubmit: (feedback: { text: string; email?: string }) => void;
    primaryColor: string;
    accentColor: string;
    translations: {
        title: string;
        placeholder: string;
        emailPlaceholder: string;
        emailHelper: string;
        submit: string;
        sending: string;
    };
}

export function FeedbackForm({
    onSubmit,
    primaryColor,
    accentColor,
    translations: t,
}: FeedbackFormProps) {
    const [feedbackText, setFeedbackText] = useState('');
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (feedbackText.trim().length < 10) {
            setError('Veuillez entrer au moins 10 caractères');
            return;
        }

        setIsSubmitting(true);
        setError('');

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        onSubmit({
            text: feedbackText.trim(),
            email: email.trim() || undefined,
        });
    };

    const isValid = feedbackText.trim().length >= 10;

    return (
        <div>
            {/* Title */}
            <motion.h2
                className="text-xl font-serif font-semibold mb-6 text-center"
                style={{ color: primaryColor }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {t.title}
            </motion.h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Feedback textarea */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder={t.placeholder}
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border resize-none focus:outline-none focus:ring-2 transition-all text-sm"
                        style={{
                            borderColor: error ? '#ef4444' : `${primaryColor}30`,
                            color: primaryColor,
                            backgroundColor: 'white',
                            // @ts-expect-error CSS custom property
                            '--tw-ring-color': accentColor,
                        }}
                    />
                    {error && (
                        <p className="text-xs text-red-500 mt-1">{error}</p>
                    )}
                    <p
                        className="text-xs mt-1 opacity-50 text-right"
                        style={{ color: primaryColor }}
                    >
                        {feedbackText.length} / 1000
                    </p>
                </motion.div>

                {/* Email input */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t.emailPlaceholder}
                        className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all text-sm"
                        style={{
                            borderColor: `${primaryColor}30`,
                            color: primaryColor,
                            backgroundColor: 'white',
                            // @ts-expect-error CSS custom property
                            '--tw-ring-color': accentColor,
                        }}
                    />
                    <p
                        className="text-xs mt-1 opacity-50"
                        style={{ color: primaryColor }}
                    >
                        {t.emailHelper}
                    </p>
                </motion.div>

                {/* Submit button */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <motion.button
                        type="submit"
                        disabled={!isValid || isSubmitting}
                        className="w-full py-4 px-6 rounded-2xl font-medium text-white flex items-center justify-center gap-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        style={{
                            background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                        }}
                        whileHover={isValid && !isSubmitting ? { scale: 1.02, y: -2 } : {}}
                        whileTap={isValid && !isSubmitting ? { scale: 0.98 } : {}}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                <span>{t.sending}</span>
                            </>
                        ) : (
                            <>
                                <Send size={20} />
                                <span>{t.submit}</span>
                            </>
                        )}
                    </motion.button>
                </motion.div>
            </form>
        </div>
    );
}
