import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const RadialMenu = ({ mainIcon = "⚙️", children = [] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const radius = 80;

    return (
        <div className="relative flex items-center justify-center">
            <AnimatePresence>
                {isOpen && children.map((child, i) => {
                    const angle = (i * (360 / children.length)) * (Math.PI / 180);
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;

                    return (
                        <motion.div
                            key={i}
                            initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                            animate={{ x, y, scale: 1, opacity: 1 }}
                            exit={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                            transition={{ delay: i * 0.05, type: "spring", stiffness: 200, damping: 20 }}
                            className="absolute z-20"
                        >
                            {child}
                        </motion.div>
                    );
                })}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 rounded-full bg-farm-green-600 text-white shadow-lg flex items-center justify-center z-30 text-2xl"
            >
                {mainIcon}
            </motion.button>
        </div>
    );
};

export default RadialMenu;
