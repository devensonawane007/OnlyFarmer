import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';

const ARField = () => {
    const {
        handleArClick,
        ARDashboard,
        FieldMap,
        SetupView
    } = useOutletContext();

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            {/* AR Launch Banner */}
            <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="mb-12 cursor-pointer relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-farm-green-900 to-[#0f0500] border border-farm-green-400/20 p-12 group"
                onClick={handleArClick}
            >
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                    <div className="w-24 h-24 rounded-full bg-farm-green-400/10 flex items-center justify-center text-5xl border border-farm-green-400/20 shadow-2xl shadow-farm-green-400/20 group-hover:bg-farm-green-400 group-hover:text-black transition-all duration-500">📱</div>
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-4xl font-display font-black text-white italic tracking-tighter uppercase mb-4">LIVE AR FIELD SCANNER</h2>
                        <p className="text-white/60 max-w-xl text-lg leading-relaxed mb-8">Overlay real-time crop health, moisture levels, and growth predictions directly onto your field using advanced spatial computing.</p>
                        <div className="inline-flex items-center gap-3 text-farm-green-400 font-black tracking-widest text-sm uppercase group-hover:gap-6 transition-all">
                            Launch Viewfinder <span>→</span>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 blur-3xl bg-farm-green-400 rounded-full group-hover:opacity-20 transition-all duration-700" />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                <GlassCard className="h-full">
                    <div className="p-8 h-full flex flex-col">
                        <h2 className="text-2xl font-display font-black text-farm-green-400 uppercase tracking-tighter italic mb-8 flex items-center gap-3">
                            <span className="text-3xl">🧩</span> Space Overview
                        </h2>
                        <div className="flex-1 bg-black/20 rounded-2xl p-4">
                            <ARDashboard />
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="h-full">
                    <div className="p-8 h-full flex flex-col">
                        <h2 className="text-2xl font-display font-black text-farm-green-400 uppercase tracking-tighter italic mb-8 flex items-center gap-3">
                            <span className="text-3xl">🗺️</span> Spatial Map
                        </h2>
                        <div className="flex-1 min-h-[400px] bg-black/20 rounded-2xl overflow-hidden border border-white/5">
                            <FieldMap />
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="col-span-full">
                    <div className="p-8">
                        <h2 className="text-2xl font-display font-black text-farm-green-400 uppercase tracking-tighter italic mb-8 flex items-center gap-3">
                            <span className="text-3xl">⚙️</span> Calibration & Setup
                        </h2>
                        <div className="bg-black/20 rounded-2xl p-6">
                            <SetupView />
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};

export default ARField;
