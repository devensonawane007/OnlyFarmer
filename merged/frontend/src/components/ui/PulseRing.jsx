import React from 'react';
import { motion } from 'framer-motion';

const PulseRing = ({ color = "#4ade80", size = "48px", className = "" }) => {
    return (
        <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
            <motion.div
                className="absolute inset-0 rounded-full border-2"
                style={{ borderColor: color }}
                animate={{
                    scale: [1, 1.8],
                    opacity: [1, 0],
                }}
                transition={{
                    duration: 1.8,
                    ease: "easeOut",
                    repeat: Infinity,
                }}
            />
            <motion.div
                className="absolute inset-0 rounded-full border-2"
                style={{ borderColor: color }}
                animate={{
                    scale: [1, 1.5],
                    opacity: [0.5, 0],
                }}
                transition={{
                    duration: 1.8,
                    delay: 0.9,
                    ease: "easeOut",
                    repeat: Infinity,
                }}
            />
            <div className="relative z-10 w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        </div>
    );
};

export default PulseRing;
