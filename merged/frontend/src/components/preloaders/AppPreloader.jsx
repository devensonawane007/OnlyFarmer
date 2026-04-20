import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AppPreloader = ({ progress }) => {
    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="fixed inset-0 z-[9999] bg-[#0f0500] flex flex-col items-center justify-center"
        >
            <div className="relative w-48 h-48 flex items-center justify-center">
                {/* SVG Seedling */}
                <svg viewBox="0 0 100 100" className="w-32 h-32">
                    {/* Stem */}
                    <motion.path
                        d="M50 80 Q50 50 50 20"
                        fill="none"
                        stroke="#4ade80"
                        strokeWidth="4"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
                    />
                    {/* Leaves */}
                    <motion.path
                        d="M50 40 Q70 30 80 40 Q70 50 50 40"
                        fill="#4ade80"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.8, duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                    />
                    <motion.path
                        d="M50 50 Q30 40 20 50 Q30 60 50 50"
                        fill="#166534"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1, duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                    />
                </svg>
                {/* Sun Rays */}
                <motion.div
                    className="absolute inset-0 border-4 border-dashed border-farm-amber-400 rounded-full opacity-20"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                />
            </div>

            <div className="mt-8 w-64 h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-farm-green-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                />
            </div>
            <p className="mt-4 text-farm-green-400 font-mono text-sm tracking-widest uppercase">
                Initializing OnlyFarmer {progress}%
            </p>
        </motion.div>
    );
};

export default AppPreloader;
