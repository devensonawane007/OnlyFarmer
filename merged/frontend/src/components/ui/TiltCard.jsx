import React, { useRef, useState } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';

const TiltCard = ({ children, className = "" }) => {
    const cardRef = useRef(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const rotateX = useSpring(useTransform(y, [-100, 100], [12, -12]), { stiffness: 300, damping: 20 });
    const rotateY = useSpring(useTransform(x, [-100, 100], [-12, 12]), { stiffness: 300, damping: 20 });

    function handleMouseMove(event) {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // Scale to -100 to 100
        x.set((mouseX / width) * 200 - 100);
        y.set((mouseY / height) * 200 - 100);
    }

    function handleMouseLeave() {
        x.set(0);
        y.set(0);
    }

    return (
        <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
                perspective: "800px"
            }}
            className={`relative ${className}`}
        >
            <div style={{ transform: "translateZ(30px)" }}>
                {children}
            </div>
        </motion.div>
    );
};

export default TiltCard;
