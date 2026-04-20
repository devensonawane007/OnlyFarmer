import logo from '../../assets/dc571dd1-c093-4f0e-83a9-37af6918e4c3-removebg-preview.png';

const Footer = ({ t }) => {
    return (
        <footer className="bg-[#0f0500] border-t border-white/5 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-4 mb-6">
                            <img src={logo} alt="OnlyFarmer" className="h-16 w-auto" />
                            <h2 className="text-3xl font-display font-black text-white italic tracking-tighter uppercase">ONLYFARMER</h2>
                        </div>
                        <p className="text-white/40 max-w-sm mb-6 leading-relaxed">
                            Empowering the next generation of agriculture through real-time IoT monitoring, AI crop prediction, and smart logistics management.
                        </p>
                        <div className="flex gap-4">
                            {['FB', 'TW', 'IG', 'LN'].map(s => (
                                <div key={s} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs text-white/60 hover:bg-farm-green-600 hover:text-black hover:border-transparent transition-all cursor-pointer">
                                    {s}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-6 uppercase text-xs tracking-widest">Platform</h4>
                        <ul className="space-y-4 text-sm text-white/50">
                            <li className="hover:text-farm-green-400 cursor-pointer transition-colors">Overview</li>
                            <li className="hover:text-farm-green-400 cursor-pointer transition-colors">Smart Farming</li>
                            <li className="hover:text-farm-green-400 cursor-pointer transition-colors">Logistics</li>
                            <li className="hover:text-farm-green-400 cursor-pointer transition-colors">AR View</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-6 uppercase text-xs tracking-widest">Connect</h4>
                        <ul className="space-y-4 text-sm text-white/50">
                            <li className="hover:text-farm-green-400 cursor-pointer transition-colors">Support</li>
                            <li className="hover:text-farm-green-400 cursor-pointer transition-colors">API Docs</li>
                            <li className="hover:text-farm-green-400 cursor-pointer transition-colors">Contact</li>
                        </ul>
                    </div>
                </div>
                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-white/20 text-xs">© 2026 OnlyFarmer AI. All rights reserved.</p>
                    <div className="flex gap-8 text-[10px] uppercase tracking-widest text-white/20">
                        <span className="hover:text-white/60 cursor-pointer transition-colors">Privacy Policy</span>
                        <span className="hover:text-white/60 cursor-pointer transition-colors">Terms of Service</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
