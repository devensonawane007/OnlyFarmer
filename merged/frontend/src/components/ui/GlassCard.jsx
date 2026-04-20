import React from 'react';
import { motion } from 'framer-motion';

const GlassCard = ({ children, className = "", ...props }) => {
    return (
        <motion.div
            className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl ${className}`}
            {...props}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            <div className="relative z-10">{children}</div>
        </motion.div>
    );
};

export default GlassCard;
