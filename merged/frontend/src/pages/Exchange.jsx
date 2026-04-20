import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';

const Exchange = () => {
    const { FarmExchange, AlertsToast } = useOutletContext();

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <h2 className="text-5xl font-display font-black text-white italic tracking-tighter uppercase mb-12">FARM EXCHANGE</h2>
            <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden p-8">
                <FarmExchange />
            </div>
            <AlertsToast />
        </div>
    );
};

export default Exchange;
