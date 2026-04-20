import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';

const Logistics = () => {
    const {
        t,
        fertInput, setFertInput,
        saveFertilizer, loadingFert, fertResult,
        trucks, loadingTrucks,
        cropResult,
        bookSelectedTruck,
        bookingResult,
    } = useOutletContext();

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {/* Fertilizer Tracking */}
                <GlassCard>
                    <div className="p-8">
                        <h2 className="text-2xl font-display font-black text-farm-green-400 uppercase tracking-tighter italic mb-8">{t.card_fert}</h2>
                        <div className="space-y-6">
                            {[
                                { label: "Farm ID", key: "farmId", icon: "🏡" },
                                { label: "Fertilizer", key: "fertilizerName", icon: "🧪" },
                                { label: "Quantity (kg)", key: "quantityKg", icon: "⚖️", type: "number" },
                            ].map(field => (
                                <div key={field.key} className="relative group">
                                    <label className="block text-[10px] uppercase font-bold tracking-widest text-white/40 mb-2 ml-1">{field.label}</label>
                                    <div className="flex items-center bg-black/40 border border-white/10 rounded-xl px-4 py-3 group-focus-within:border-farm-green-400/50 transition-colors">
                                        <input
                                            type={field.type || "text"}
                                            className="bg-transparent border-none outline-none text-white w-full font-mono text-lg"
                                            value={fertInput[field.key]}
                                            onChange={e => setFertInput({ ...fertInput, [field.key]: field.type === "number" ? +e.target.value : e.target.value })}
                                        />
                                        <span className="opacity-40">{field.icon}</span>
                                    </div>
                                </div>
                            ))}

                            <button
                                className="w-full py-4 rounded-xl bg-farm-green-600 hover:bg-farm-green-500 text-black font-black uppercase tracking-widest text-sm shadow-lg disabled:opacity-50 transition-all"
                                onClick={saveFertilizer}
                                disabled={loadingFert}
                            >
                                {loadingFert ? "⏳ Saving..." : t.btn_save}
                            </button>

                            {fertResult && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-4 rounded-xl bg-farm-green-400/10 border border-farm-green-400/20 text-center text-xs font-mono uppercase tracking-widest text-farm-green-400"
                                >
                                    ✅ Logged successfully! ID: {fertResult.id}
                                </motion.div>
                            )}
                        </div>
                    </div>
                </GlassCard>

                {/* Truck Booking */}
                <GlassCard>
                    <div className="p-8">
                        <h2 className="text-2xl font-display font-black text-farm-green-400 uppercase tracking-tighter italic mb-8">{t.card_truck}</h2>

                        {!cropResult?.recommended_crop && (
                            <div className="mb-6 p-4 rounded-xl bg-farm-amber-400/10 border border-farm-amber-400/20 text-farm-amber-400 text-xs font-medium">
                                ⚠️ Please select or predict a crop in Smart Farming before booking logistics.
                            </div>
                        )}

                        {trucks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 opacity-40">
                                <span className="text-6xl mb-4">🚛</span>
                                <p className="font-mono text-xs uppercase tracking-widest">{t.status_no_trucks}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {trucks.map(truck => (
                                    <div key={truck.truckId} className="bg-white/5 border border-white/5 p-5 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-farm-teal-400/10 flex items-center justify-center text-2xl">🚛</div>
                                            <div>
                                                <p className="text-sm font-black text-white">{truck.truckId}</p>
                                                <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{truck.capacityTons}t Capacity</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-6">
                                            <div>
                                                <p className="text-sm font-mono text-farm-green-400 font-bold">₹{truck.pricePerKm}</p>
                                                <p className="text-[9px] uppercase tracking-tighter text-white/40">Per KM</p>
                                            </div>
                                            <button
                                                className="px-6 py-2 rounded-lg bg-white text-black font-black text-[10px] uppercase hover:bg-farm-green-400 transition-colors disabled:opacity-30 disabled:hover:bg-white"
                                                disabled={!cropResult?.recommended_crop}
                                                onClick={() => bookSelectedTruck(truck.truckId)}
                                            >
                                                BOOk
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {bookingResult && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-6 p-4 rounded-xl bg-farm-teal-400/10 border border-farm-teal-400/20 text-center text-xs font-mono uppercase tracking-widest text-farm-teal-400"
                            >
                                🎉 Logistics confirmed! Prepare for pickup.
                            </motion.div>
                        )}
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};

export default Logistics;
