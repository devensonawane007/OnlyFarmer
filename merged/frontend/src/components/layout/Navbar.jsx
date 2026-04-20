import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFarmStore } from '../../store/farmStore';
import logo from '../../assets/dc571dd1-c093-4f0e-83a9-37af6918e4c3-removebg-preview.png';

const Navbar = ({ t, cycleLanguage, getLangLabel, getIotData, loadingIot }) => {
    const location = useLocation();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navItems = [
        { path: '/dashboard', label: t.tab_1, icon: "🏠" },
        { path: '/farming', label: t.tab_2, icon: "🌱" },
        { path: '/logistics', label: t.tab_3, icon: "🚛" },
        { path: '/ar', label: t.tab_4, icon: "📱" },
        { path: '/exchange', label: t.tab_5 || "Exchange", icon: "🤝" },
    ];

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-[#0f0500]/80 backdrop-blur-lg py-2 shadow-2xl border-b border-white/10' : 'bg-transparent py-4'}`}>
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="relative">
                        <motion.img
                            src={logo}
                            alt="OnlyFarmer Logo"
                            className="h-16 w-auto group-hover:scale-110 transition-transform duration-500"
                            whileHover={{ rotate: 5 }}
                        />
                        <motion.div
                            className="absolute -inset-1 bg-farm-green-400/20 blur-lg rounded-full -z-10"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                            transition={{ duration: 4, repeat: Infinity }}
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-display font-black tracking-tighter text-white leading-none group-hover:text-farm-green-400 transition-colors">ONLYFARMER</h1>
                        <p className="text-[10px] font-mono text-farm-green-600 uppercase tracking-[0.2em]">{t.subtitle}</p>
                    </div>
                </Link>

                <div className="hidden md:flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/5">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors ${location.pathname === item.path ? 'text-white' : 'text-white/60 hover:text-white'}`}
                        >
                            {location.pathname === item.path && (
                                <motion.div
                                    layoutId="nav-pill"
                                    className="absolute inset-0 bg-farm-green-600 rounded-full -z-10"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="flex items-center gap-2">
                                <span className="text-lg">{item.icon}</span>
                                {item.label}
                            </span>
                        </Link>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={cycleLanguage} className="bg-white/5 hover:bg-white/10 p-2 rounded-xl border border-white/10 transition-all text-sm font-mono text-white/80">
                        {getLangLabel()}
                    </button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={getIotData}
                        disabled={loadingIot}
                        className="bg-farm-green-600 hover:bg-farm-green-500 text-black font-bold px-5 py-2 rounded-xl transition-all shadow-lg shadow-farm-green-600/20 flex items-center gap-2"
                    >
                        {loadingIot ? <span className="animate-spin text-xl">⏳</span> : "📡 " + t.btn_iot.replace('📡 ', '')}
                    </motion.button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
