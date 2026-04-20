import React from 'react';
import { useOutletContext } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';

const Farming = () => {
    const {
        t,
        predictCrop,
        loadingCrop,
        cropResult,
        top3,
        seedsCost, setSeedsCost,
        fertilizerCost, setFertilizerCost,
        laborCost, setLaborCost,
        totalExpenses,
        cropPrices,
        loadCropPrices
    } = useOutletContext();

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {/* Prediction Card */}
                <GlassCard>
                    <div className="p-8">
                        <h2 className="text-2xl font-display font-black text-farm-green-400 uppercase tracking-tighter italic mb-8">{t.card_predict}</h2>
                        <button
                            className="w-full py-4 rounded-xl bg-farm-green-600 hover:bg-farm-green-500 text-black font-black uppercase tracking-widest text-sm shadow-lg disabled:opacity-50 transition-all mb-8"
                            onClick={predictCrop}
                            disabled={loadingCrop}
                        >
                            {loadingCrop ? "⏳ Predicting..." : t.btn_predict}
                        </button>

                        {cropResult && (
                            <div className="space-y-6">
                                <div className="bg-farm-green-400/10 border border-farm-green-400/20 p-6 rounded-2xl text-center">
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-farm-green-400 mb-2">Primary Recommendation</p>
                                    <h3 className="text-4xl font-display font-black text-white">{cropResult.recommended_crop}</h3>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-xs font-mono text-white/40 uppercase tracking-widest">Top Candidates</p>
                                    {top3.map((c, i) => (
                                        <div key={i} className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
                                            <span className="w-6 text-xs font-black text-farm-green-600">#{i + 1}</span>
                                            <span className="flex-1 font-bold text-sm">{c.crop}</span>
                                            <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-farm-green-400" style={{ width: `${c.confidence}%` }} />
                                            </div>
                                            <span className="text-xs font-mono text-white/60">{c.confidence}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </GlassCard>

                {/* Expenses Card */}
                <GlassCard>
                    <div className="p-8">
                        <h2 className="text-2xl font-display font-black text-farm-green-400 uppercase tracking-tighter italic mb-8">{t.card_expenses}</h2>
                        <div className="space-y-6">
                            {[
                                { label: t.label_seeds, value: seedsCost, setter: setSeedsCost, icon: "🌱" },
                                { label: t.label_fert, value: fertilizerCost, setter: setFertilizerCost, icon: "🧪" },
                                { label: t.label_labor, value: laborCost, setter: setLaborCost, icon: "👷" },
                            ].map(({ label, value, setter, icon }) => (
                                <div className="relative group" key={label}>
                                    <label className="block text-[10px] uppercase font-bold tracking-widest text-white/40 mb-2 ml-1">{label}</label>
                                    <div className="flex items-center bg-black/40 border border-white/10 rounded-xl px-4 py-3 group-focus-within:border-farm-green-400/50 transition-colors">
                                        <span className="text-white/40 mr-2">₹</span>
                                        <input
                                            type="number"
                                            className="bg-transparent border-none outline-none text-white w-full font-mono text-lg"
                                            value={value}
                                            onChange={e => setter(+e.target.value)}
                                        />
                                        <span className="opacity-40">{icon}</span>
                                    </div>
                                </div>
                            ))}
                            <div className="mt-8 pt-8 border-t border-white/10 flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Total projected cost</p>
                                    <h3 className="text-4xl font-display font-black text-farm-green-400">₹{totalExpenses.toLocaleString()}</h3>
                                </div>
                                <div className="text-farm-amber-400 bg-farm-amber-400/10 px-3 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase">
                                    Active Tracker
                                </div>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Prices Section */}
            <GlassCard>
                <div className="p-8">
                    <div className="flex justify-between items-center mb-12">
                        <h2 className="text-3xl font-display font-black text-white italic tracking-tighter uppercase">{t.card_prices}</h2>
                        <button className="text-xs font-mono text-farm-green-400 hover:text-white transition-colors" onClick={loadCropPrices}>↻ REFRESH MANDI DATA</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {cropPrices.length === 0 ? (
                            <p className="col-span-full text-center text-white/20 py-12 font-mono text-sm uppercase tracking-widest">{t.status_loading}</p>
                        ) : cropPrices.map((p, i) => (
                            <div key={i} className="bg-white/5 border border-white/5 p-6 rounded-2xl flex flex-col justify-between hover:bg-white/10 transition-all group">
                                <div className="flex justify-between items-start mb-6">
                                    <h4 className="text-lg font-black text-white tracking-tight">{p.crop}</h4>
                                    <span className="text-[10px] font-mono text-farm-green-400 bg-farm-green-400/10 px-2 py-0.5 rounded">MSP: ₹{p.msp}</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] uppercase text-white/40 font-bold mb-1">Market Max</p>
                                        <p className="text-2xl font-display font-bold text-white group-hover:text-farm-amber-400 transition-colors">₹{p.max_price}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase text-white/40 font-bold mb-1">Min</p>
                                        <p className="text-sm font-mono text-white/60">₹{p.min_price}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </GlassCard>
        </div>
    );
};

export default Farming;
