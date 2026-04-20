import React from 'react';
import { Outlet, useLocation, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import ChatBot from '../ui/ChatBot';
import { pageVariants } from '../../lib/motionVariants';

const RootLayout = (props) => {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-[#0f0500] text-white selection:bg-farm-green-400 selection:text-black">
            <Navbar {...props} />

            <main className="relative pt-24 min-h-[calc(100vh-400px)]">
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={location.pathname}
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="w-full"
                    >
                        <Outlet context={props} />
                    </motion.div>
                </AnimatePresence>
            </main>

            <Footer {...props} />
            <ChatBot />
        </div>
    );
};

export default RootLayout;
