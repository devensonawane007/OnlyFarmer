import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const StepWizard = ({ steps, currentStep, onStepChange }) => {
    return (
        <div className="relative overflow-hidden w-full h-full min-h-[400px]">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -300, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="w-full"
                >
                    {steps[currentStep]}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default StepWizard;
