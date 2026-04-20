import React, { Suspense, lazy } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import CountUp from '../components/ui/CountUp';
import MorphBlob from '../components/ui/MorphBlob';
import TiltCard from '../components/ui/TiltCard';
import { scrollReveal, cardVariants, staggerContainer } from '../lib/motionVariants';

const GlobeScene = lazy(() => import('../components/3d/GlobeScene'));
const CropScene = lazy(() => import('../components/3d/CropScene'));

const Landing = () => {
    const { t } = useOutletContext();
    const { scrollYProgress } = useScroll();
    const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
    const y2 = useTransform(scrollYProgress, [0, 1], [0, 200]);

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#0f0500]">
            {/* Hero Section */}
            <section className="relative z-10 pt-20 pb-32 px-6 max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <motion.span
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-block px-4 py-1.5 rounded-full bg-farm-green-400/10 border border-farm-green-400/20 text-farm-green-400 text-xs font-bold tracking-widest uppercase mb-6"
                        >
                            Next-Gen Agriculture Platform
                        </motion.span>
                        <h1 className="text-6xl md:text-8xl font-display font-black text-white leading-[0.9] tracking-tighter mb-8 italic">
                            THE FUTURE <br />
                            <span className="text-farm-green-400 uppercase">OF FARMING</span>
                        </h1>
                        <p className="text-xl text-white/60 mb-12 max-w-lg leading-relaxed">
                            Transforming agriculture through artificial intelligence, real-time IoT monitoring, and decentralized logistics.
                        </p>
                        <div className="flex flex-wrap gap-6">
                            <Link to="/dashboard">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-8 py-4 rounded-2xl bg-white text-black font-black text-lg shadow-2xl hover:bg-farm-green-400 transition-colors"
                                >
                                    START EXPLORING
                                </motion.button>
                            </Link>
                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-4">
                                    {[1, 2, 3].map(i => (
                                        <img key={i} src={`https://i.pravatar.cc/100?img=${i + 10}`} className="w-12 h-12 rounded-full border-2 border-black" />
                                    ))}
                                </div>
                                <div className="text-sm">
                                    <p className="text-white font-bold">500+ Farmers</p>
                                    <p className="text-white/40 italic">Trust our platform</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.5 }}
                        className="relative aspect-square"
                    >
                        <Suspense fallback={<div className="w-full h-full bg-white/5 rounded-full animate-pulse" />}>
                            <GlobeScene />
                        </Suspense>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0500] via-transparent to-transparent pointer-events-none" />
                    </motion.div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="relative z-10 py-20 px-6 max-w-7xl mx-auto border-y border-white/5 bg-white/[0.02]">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        { label: "Predictive Accuracy", value: 98, unit: "%" },
                        { label: "Active IoT Sensors", value: 1250, unit: "+" },
                        { label: "Countries Reached", value: 42, unit: "" },
                        { label: "Community Hubs", value: 156, unit: "" },
                    ].map((s, i) => (
                        <motion.div
                            key={i}
                            variants={scrollReveal}
                            initial="initial"
                            whileInView="animate"
                            viewport={{ once: true }}
                            className="text-center"
                        >
                            <h3 className="text-4xl md:text-6xl font-display font-black text-white mb-2">
                                <CountUp to={s.value} />{s.unit}
                            </h3>
                            <p className="text-xs uppercase tracking-widest text-white/40">{s.label}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Features Grid */}
            <section className="relative z-10 py-32 px-6 max-w-7xl mx-auto">
                <div className="text-center mb-24">
                    <motion.h2
                        variants={scrollReveal}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                        className="text-4xl md:text-7xl font-display font-black text-white italic tracking-tighter uppercase mb-6"
                    >
                        Smart Ecosystem
                    </motion.h2>
                    <p className="text-white/40 text-lg uppercase tracking-widest">Everything you need to scale your farm</p>
                </div>

                <motion.div
                    variants={staggerContainer}
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8"
                >
                    {[
                        { title: "IoT Analytics", icon: "📡", desc: "Live monitoring of soil NPK, moisture and local weather." },
                        { title: "AI Predictions", icon: "🧠", desc: "Crop recommendations based on 10+ years of soil data." },
                        { title: "Smart Logistics", icon: "🚛", desc: "Direct mandi connect and automated truck booking." },
                        { title: "AR Field Scan", icon: "🥽", desc: "View invisible data layers directly on your land." },
                        { title: "Global Exchange", icon: "🤝", desc: "Trade produce with global buyers without middlemen." },
                        { title: "Expert Hub", icon: "👨‍🌾", desc: "24/7 access to agronomists and AI-powered advice." },
                    ].map((f, i) => (
                        <TiltCard key={i}>
                            <GlassCard className="h-full p-8 group">
                                <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-500">{f.icon}</div>
                                <h4 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter">{f.title}</h4>
                                <p className="text-white/50 leading-relaxed text-sm">{f.desc}</p>
                            </GlassCard>
                        </TiltCard>
                    ))}
                </motion.div>
            </section>

            {/* 3D Crop Section */}
            <section className="relative py-48 overflow-hidden bg-black/40">
                <div className="absolute inset-0 z-0">
                    <Suspense fallback={null}>
                        <CropScene />
                    </Suspense>
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0f0500] via-transparent to-[#0f0500]" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
                    <motion.div
                        style={{ y: y1 }}
                        className="inline-block p-12 bg-black/40 backdrop-blur-2xl rounded-[3rem] border border-white/10"
                    >
                        <h2 className="text-5xl md:text-8xl font-display font-black text-white tracking-tight uppercase italic mb-8">
                            Nurture with <br />
                            <span className="text-farm-green-400">Precision</span>
                        </h2>
                        <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed mb-12">
                            Our procedural growth models ensure you get the highest yield while minimizing resource waste.
                        </p>
                        <Link to="/farming">
                            <button className="bg-farm-green-600 px-10 py-5 rounded-2xl text-black font-black uppercase tracking-widest hover:bg-farm-green-400 transition-all">
                                VIEW FIELD ANALYSIS
                            </button>
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Decorative Blobs */}
            <MorphBlob className="top-20 -left-20 w-[600px] h-[600px] opacity-20" color="#22d3ee" style={{ y: y1 }} />
            <MorphBlob className="bottom-40 -right-20 w-[800px] h-[800px] opacity-10" color="#4ade80" style={{ y: y2 }} />
        </div>
    );
};

export default Landing;
