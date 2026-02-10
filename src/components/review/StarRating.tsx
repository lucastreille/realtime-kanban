'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';

interface StarRatingProps {
    value: number;
    onChange: (rating: number) => void;
    size?: 'small' | 'medium' | 'large';
    primaryColor?: string;
    accentColor?: string;
    disabled?: boolean;
}

export function StarRating({
    value,
    onChange,
    size = 'large',
    primaryColor = '#C9A86C',
    accentColor = '#8B7355',
    disabled = false,
}: StarRatingProps) {
    const [hoveredStar, setHoveredStar] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const sizeConfig = {
        small: { star: 32, gap: 8 },
        medium: { star: 48, gap: 12 },
        large: { star: 64, gap: 16 },
    };

    const config = sizeConfig[size];
    const displayValue = hoveredStar || value;

    const handleClick = (star: number) => {
        if (disabled) return;
        setIsAnimating(true);
        onChange(star);

        // Haptic feedback on mobile
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }

        setTimeout(() => setIsAnimating(false), 600);
    };

    return (
        <div
            className="flex items-center justify-center"
            style={{ gap: config.gap }}
            role="radiogroup"
            aria-label="Rating"
        >
            {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = displayValue >= star;
                const isSelected = value === star && isAnimating;

                return (
                    <motion.button
                        key={star}
                        type="button"
                        disabled={disabled}
                        onClick={() => handleClick(star)}
                        onMouseEnter={() => !disabled && setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        onFocus={() => !disabled && setHoveredStar(star)}
                        onBlur={() => setHoveredStar(0)}
                        className="relative focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-full transition-transform"
                        style={{
                            width: config.star,
                            height: config.star,
                            // focusRing color
                            // @ts-expect-error CSS custom property
                            '--tw-ring-color': primaryColor,
                        }}
                        whileHover={{ scale: disabled ? 1 : 1.15, rotate: disabled ? 0 : 5 }}
                        whileTap={{ scale: disabled ? 1 : 0.9 }}
                        animate={isSelected ? {
                            scale: [1, 1.4, 1],
                            rotate: [0, 10, -10, 0],
                        } : {}}
                        transition={{
                            type: 'spring',
                            stiffness: 400,
                            damping: 17,
                        }}
                        aria-label={`${star} star${star > 1 ? 's' : ''}`}
                        aria-checked={value === star}
                        role="radio"
                    >
                        {/* Glow effect */}
                        <AnimatePresence>
                            {isFilled && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 0.4, scale: 1.5 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    className="absolute inset-0 rounded-full blur-xl"
                                    style={{ backgroundColor: primaryColor }}
                                />
                            )}
                        </AnimatePresence>

                        {/* Star icon */}
                        <motion.div
                            className="relative z-10"
                            animate={{
                                color: isFilled ? primaryColor : accentColor,
                            }}
                        >
                            <Star
                                size={config.star}
                                fill={isFilled ? primaryColor : 'none'}
                                stroke={isFilled ? primaryColor : accentColor}
                                strokeWidth={1.5}
                                className="transition-all duration-200"
                            />
                        </motion.div>

                        {/* Sparkle effect on selection */}
                        <AnimatePresence>
                            {isSelected && star >= 4 && (
                                <>
                                    {[...Array(6)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className="absolute w-1.5 h-1.5 rounded-full"
                                            style={{ backgroundColor: primaryColor }}
                                            initial={{
                                                opacity: 1,
                                                scale: 0,
                                                x: 0,
                                                y: 0,
                                            }}
                                            animate={{
                                                opacity: 0,
                                                scale: 1,
                                                x: Math.cos(i * 60 * Math.PI / 180) * 40,
                                                y: Math.sin(i * 60 * Math.PI / 180) * 40,
                                            }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.5, delay: i * 0.05 }}
                                        />
                                    ))}
                                </>
                            )}
                        </AnimatePresence>
                    </motion.button>
                );
            })}
        </div>
    );
}
