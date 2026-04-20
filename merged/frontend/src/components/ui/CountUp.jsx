import React, { useEffect, useRef } from 'react';
import { useMotionValue, useSpring, useInView } from 'framer-motion';

const CountUp = ({ to, duration = 2, className = "" }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    const motionValue = useMotionValue(0);
    const springValue = useSpring(motionValue, {
        stiffness: 100,
        damping: 30,
        duration: duration * 1000
    });

    useEffect(() => {
        if (isInView) {
            motionValue.set(to);
        }
    }, [isInView, motionValue, to]);

    useEffect(() => {
        const unsub = springValue.on("change", (latest) => {
            if (ref.current) {
                ref.current.textContent = Math.floor(latest).toLocaleString();
            }
        });
        return () => unsub();
    }, [springValue]);

    return <span ref={ref} className={className}>0</span>;
};

export default CountUp;
