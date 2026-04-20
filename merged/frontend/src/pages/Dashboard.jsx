import React, { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cardVariants } from '../lib/motionVariants';
import GlassCard from '../components/ui/GlassCard';

// Mock components to represent existing structure
// In actual App.jsx, these are rendered inline depending on state
const Dashboard = () => {
    const {
        t,
        tip,
        tipDate,
        FARM_CARDS,
        ExpandableCards,
        sensor,
        getIotData,
        selectedFile,
        handleFileChange,
        handleUpload,
        uploadStatus,
        diseaseResult,
        uploadedProblems,
        SensorBox
    } = useOutletContext();

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {/* Tip Card */}
                <GlassCard className="col-span-full">
                    <div className="p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-display font-black text-farm-green-400 uppercase tracking-tighter italic">{t.card_tip}</h2>
                            {tipDate && <span className="text-xs font-mono text-white/40 border border-white/10 px-3 py-1 rounded-full">{tipDate}</span>}
                        </div>
                        <p className="text-lg text-white/80 leading-relaxed italic">{tip || t.status_loading}</p>
                    </div>
                </GlassCard>

                {/* IoT Sensors Card */}
                <GlassCard>
                    <div className="p-8">
                        <h2 className="text-2xl font-display font-black text-farm-green-400 uppercase tracking-tighter italic mb-8">{t.card_iot}</h2>
                        {!sensor ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <div className="text-6xl mb-6 opacity-20">📡</div>
                                <p className="text-white/60 mb-8">{t.status_no_data}</p>
                                <button className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold text-sm" onClick={getIotData}>{t.btn_iot}</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                <SensorBox label="N" value={sensor.N} color="#4ade80" />
                                <SensorBox label="P" value={sensor.P} color="#60a5fa" />
                                <SensorBox label="K" value={sensor.K} color="#f97316" />
                                <SensorBox label="Temp" value={sensor.temperature} unit="°C" color="#fb7185" />
                                <SensorBox label="Humidity" value={sensor.humidity} unit="%" color="#a78bfa" />
                                <SensorBox label="pH" value={sensor.ph} color="#34d399" />
                                <SensorBox label="Rainfall" value={sensor.rainfall} unit="mm" color="#38bdf8" />
                            </div>
                        )}
                    </div>
                </GlassCard>

                {/* Disease Detection Card */}
                <GlassCard>
                    <div className="p-8">
                        <h2 className="text-2xl font-display font-black text-farm-green-400 uppercase tracking-tighter italic mb-8">{t.card_problem}</h2>
                        <div className="space-y-6">
                            <label className={`block relative group cursor-pointer border-2 border-dashed rounded-2xl p-8 transition-all ${selectedFile ? "border-farm-green-400/50 bg-farm-green-400/5" : "border-white/10 hover:border-white/20"}`}>
                                <div className="flex flex-col items-center gap-3">
                                    <span className="text-4xl">{selectedFile ? "✅" : "📸"}</span>
                                    <span className="font-mono text-xs uppercase tracking-widest text-white/60">
                                        {selectedFile ? selectedFile.name : "Select Crop Image"}
                                    </span>
                                </div>
                                <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </label>
                            <button
                                className="w-full py-4 rounded-xl bg-farm-green-600 hover:bg-farm-green-500 text-black font-black uppercase tracking-widest text-sm shadow-lg disabled:opacity-50 transition-all"
                                onClick={handleUpload}
                                disabled={!selectedFile || uploadStatus === t.status_loading}
                            >
                                {uploadStatus === t.status_loading ? "⏳ Analysing..." : "🔍 Detect Disease"}
                            </button>
                        </div>

                        {uploadStatus && uploadStatus !== t.status_loading && (
                            <div className={`mt-6 p-4 rounded-xl text-center text-xs font-mono uppercase tracking-widest border ${uploadStatus.includes("✅") ? "bg-farm-green-400/10 border-farm-green-400/20 text-farm-green-400" : "bg-red-400/10 border-red-400/20 text-red-400"}`}>
                                {uploadStatus}
                            </div>
                        )}

                        {diseaseResult && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-8 p-6 rounded-2xl bg-white/5 border border-white/10"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="text-xl font-bold text-white mb-1">{diseaseResult.disease}</h4>
                                        <p className="text-xs font-mono text-white/40">Confidence: {diseaseResult.confidence}%</p>
                                    </div>
                                    <span className="px-3 py-1 rounded-lg bg-red-400/20 text-red-400 text-[10px] font-black uppercase tracking-widest">
                                        {diseaseResult.severity} Risk
                                    </span>
                                </div>
                                <div className="grid gap-4 mt-6">
                                    <div className="bg-black/20 p-4 rounded-xl">
                                        <p className="text-[10px] uppercase tracking-widest text-farm-green-400 mb-1 font-bold">Treatment</p>
                                        <p className="text-sm text-white/70">{diseaseResult.treatment}</p>
                                    </div>
                                    <div className="bg-black/20 p-4 rounded-xl">
                                        <p className="text-[10px] uppercase tracking-widest text-farm-green-400 mb-1 font-bold">Prevention</p>
                                        <p className="text-sm text-white/70">{diseaseResult.prevention}</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </GlassCard>
            </div>

            {/* Knowledge Cards */}
            <div className="mb-24">
                <h2 className="text-4xl font-display font-black text-white italic tracking-tighter uppercase mb-12">FARM KNOWLEDGE</h2>
                <ExpandableCards cards={FARM_CARDS} />
            </div>
        </div>
    );
};

export default Dashboard;
