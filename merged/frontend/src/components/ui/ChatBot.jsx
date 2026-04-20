import React, { useState, useEffect, useRef } from 'react';
import logo from '../../assets/dc571dd1-c093-4f0e-83a9-37af6918e4c3-removebg-preview.png';

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { sender: "bot", text: "🌾 Namaste! I am Kisan AI — your personal farming assistant. Ask me anything about crops, fertilizers, pest control, irrigation, or government schemes!" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef(null);

    const FARMING_SYSTEM = `You are Kisan AI — a friendly expert farming assistant for Indian farmers.
Speak warmly and simply. Keep answers SHORT (2-4 sentences max).
You know: Indian crops (wheat, rice, cotton, soybean, onion, tomato, potato, maize, sugarcane),
seeding seasons, irrigation, fertilizer doses, pest control, MSP prices, PM-KISAN, PMFBY.
Give exact quantities when relevant. End with one actionable tip. Use simple words.`;

    const sendMessage = async () => {
        if (!input.trim()) return;
        const userMsg = { sender: "user", text: input };
        const currentInput = input;
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);
        try {
            const history = messages.slice(-8).map(m => ({
                role: m.sender === "user" ? "user" : "assistant",
                content: m.text
            }));
            history.push({ role: "user", content: currentInput });

            const res = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "claude-haiku-4-5-20251001",
                    max_tokens: 300,
                    system: FARMING_SYSTEM,
                    messages: history,
                })
            });
            const data = await res.json();
            const reply = data.content?.[0]?.text || "Sorry, I could not get a response. Please try again.";
            setMessages((prev) => [...prev, { sender: "bot", text: reply }]);
        } catch {
            const q = currentInput.toLowerCase();
            let reply = "I'm having trouble connecting right now. Please check your internet connection and try again! 🌾";
            if (q.includes("wheat") || q.includes("गेहूं")) reply = "🌾 Wheat needs 4-6 irrigations. First irrigation at 21 days (crown root stage) is most critical. Apply 50kg urea/acre at sowing + 50kg at first irrigation. 💡 Best sowing time: Nov 1-15.";
            else if (q.includes("rice") || q.includes("paddy") || q.includes("धान")) reply = "🌿 Paddy needs 5cm standing water during tillering. Transplant 25-30 day seedlings, 2-3 per hill, 20x15cm spacing. Apply 120kg urea/acre in 3 splits. 💡 Drain field 2 weeks before harvest.";
            else if (q.includes("pest") || q.includes("disease") || q.includes("blight")) reply = "🐛 First spray neem oil (5ml/liter) as organic defense. For fungal diseases use Mancozeb 75WP at 2.5g/liter. 💡 Spray before 9am for best results.";
            else if (q.includes("fertilizer") || q.includes("urea") || q.includes("dap") || q.includes("खाद")) reply = "🧪 General: DAP 50kg/acre at sowing + urea 50kg/acre after 3 weeks + MOP 25kg/acre for potash. 💡 Apply when soil has moisture for best absorption.";
            else if (q.includes("msp") || q.includes("price") || q.includes("rate")) reply = "💰 Check MSP at agmarknet.gov.in. PM-KISAN gives ₹6000/year — register at pmkisan.gov.in. 💡 Sell at APMC mandi for transparent pricing.";
            else if (q.includes("onion") || q.includes("प्याज") || q.includes("कांदा")) reply = "🧅 Onion: transplant 6-week seedlings, 15x10cm spacing. Needs 8-10 irrigations, stop 2 weeks before harvest. Apply 100kg urea/acre in 3 doses. 💡 Harvest when tops fall naturally.";
            else if (q.includes("tomato") || q.includes("टमाटर")) reply = "🍅 Tomato: stake plants at 45cm, irrigate every 4-5 days. Watch for late blight — spray Ridomil at first sign. Apply 100kg urea/acre in 4 splits. 💡 Mulch to retain moisture and reduce weeds.";
            setMessages((prev) => [...prev, { sender: "bot", text: reply }]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="fixed bottom-8 right-8 z-[100]">
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-16 h-16 rounded-full bg-farm-green-600 text-white shadow-2xl flex items-center justify-center p-2 hover:scale-110 active:scale-95 transition-all outline-none border-none group"
                >
                    <img src={logo} alt="Kisan AI" className="w-full h-full object-contain" />
                    <span className="absolute right-full mr-4 px-4 py-2 rounded-xl bg-black/80 backdrop-blur-md text-white text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10 pointer-events-none">
                        Ask Kisan AI
                    </span>
                </button>
            )}
            {isOpen && (
                <div className="w-[400px] h-[600px] bg-[#0f0500] border border-white/10 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                        <div className="flex items-center gap-3">
                            <img src={logo} alt="Kisan AI" className="h-12 w-auto object-contain" />
                            <div>
                                <h4 className="text-white font-black uppercase tracking-tighter">Kisan AI</h4>
                                <p className="text-[10px] text-farm-green-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-farm-green-400 animate-pulse" /> Live Support
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                        >
                            ✖
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${m.sender === 'user' ? 'bg-farm-green-600 text-black font-medium rounded-tr-none' : 'bg-white/5 text-white/80 rounded-tl-none border border-white/10'}`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/10 flex gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce [animation-delay:0.2s]" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce [animation-delay:0.4s]" />
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="p-6 border-t border-white/5">
                        <div className="flex gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus-within:border-farm-green-400/50 transition-colors">
                            <input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && sendMessage()}
                                placeholder="Ask about crops..."
                                className="flex-1 bg-transparent border-none outline-none text-white text-sm"
                            />
                            <button onClick={sendMessage} className="text-farm-green-400 hover:text-white transition-colors">➤</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatBot;
