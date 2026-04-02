import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import Announcements from "@/components/Announcements";
import { supabase } from "@/api/supabaseClient";
import { 
    BookOpen, 
    FileText, 
    Building2, 
    DollarSign,
    Stethoscope,
    Package,
    MessageSquare,
    TestTube,
    Camera,
    Sparkles,
    Heart,
    Award,
    Lightbulb,
    Smile,
    Quote,
    Send,
    MessageCircle,
    Scale
} from "lucide-react";

const MOTIVATIONAL_QUOTES = [
    { text: "The best way to find yourself is to lose yourself in the service of others.", author: "Gandhi" },
    { text: "Nurses are the heart of healthcare.", author: null },
    { text: "Every patient is a story — thank you for being part of theirs.", author: null },
    { text: "Your compassion makes a difference, even on the hard days.", author: null },
    { text: "Healthcare heroes don't wear capes — they wear scrubs.", author: null },
    { text: "What you do matters more than you know.", author: null },
    { text: "Teamwork makes the dream work — and saves lives.", author: null },
    { text: "Caring is the essence of nursing.", author: "Jean Watson" },
    { text: "To do what nobody else will do, in a way that nobody else can, in spite of all we go through — that is what it means to be a nurse.", author: "Rawsi Williams" },
    { text: "Not all heroes wear capes. Some wear stethoscopes.", author: null },
    { text: "Be the reason someone smiles today.", author: null },
    { text: "Small acts of care create ripples of hope.", author: null },
    { text: "You are making a difference — one patient at a time.", author: null },
    { text: "The world needs who you were made to be.", author: null },
    { text: "Difficult roads often lead to beautiful destinations. Keep going.", author: null },
    { text: "Courage doesn't always roar. Sometimes it's the quiet voice at the end of the day saying 'I will try again tomorrow.'", author: "Mary Anne Radmacher" },
    { text: "Where there is a heart that cares, there is a hand that heals.", author: null },
    { text: "You don't build a career in healthcare — you build a legacy of lives touched.", author: null },
    { text: "A kind word, a gentle touch — sometimes that's the best medicine.", author: null },
    { text: "Together we are stronger than any challenge we face.", author: null },
];

const DAILY_JOKES = [
    "Patient said they only take 'natural' supplements. Their med list was 3 pages long. All from Amazon. 📦",
    "My favorite vital sign is the one where the patient says 'I feel fine' while their BP is 210/120. 🎭",
    "'I Googled my symptoms.' Ma'am, you have a cold. Google said you have 4 days to live. Very different things. 🔍",
    "The EHR crashed mid-charting and honestly? Best 15-minute break I've had all week. 🖥️",
    "Patient: 'I don't take any medications.' Me: *pulls out Walmart bag with 47 bottles* 👀",
    "Nothing humbles you faster than a patient saying 'the other nurse does it differently.' 💀",
    "Told a patient to fast after midnight. They showed up with a Starbucks. At 7 AM. Venti. ☕",
    "My stethoscope hears everything except patients telling the truth about their alcohol intake. 🩺",
    "'Rate your pain 1-10.' '15.' Sir, you're on your phone playing Candy Crush. 📱",
    "Day shift thinks night shift does nothing. Night shift thinks day shift is dramatic. Both are correct. 🌙",
    "Charting is just creative writing with legal consequences. ✍️",
    "Me: 'Any allergies?' Patient: 'Yes, mornings.' Same honestly. ☀️",
    "The printer works perfectly until you actually need to print something. Every single time. 🖨️",
    "'I only had two drinks.' The two drinks: a fishbowl and a boot. 🍺",
    "Running a clinic is 10% medicine, 40% paperwork, and 50% trying to get the fax machine to work. 📠",
    "Patient: 'I stopped taking my meds because I felt better.' That's... that's what the meds do. 💊",
    "I didn't choose the scrub life. I mean I did, but I didn't know about the 12-hour shifts. 🩵",
    "'Are you pregnant?' 'No.' Lab results: 👶 Surprise! 🎉",
    "When the patient says 'I've been meaning to come in for months' and their labs look like a cry for help. 📊",
    "The break room microwave has seen things that would violate OSHA regulations. 🍲",
    "Patients who diagnose themselves on TikTok are the final boss of healthcare. 🎵",
    "Me: 'When did the pain start?' Patient: 'Well, in 1987...' *settles in* 📅",
    "I don't have a favorite patient. But I definitely have a least favorite call light. 🔔",
    "'I'm not a difficult patient.' — Every difficult patient. 🏆",
    "Lunchtime in healthcare means eating a granola bar over the sink at 3 PM. Bon appétit. 🥐",
    "The only thing spreading faster than a cold in this office is gossip. 🤧",
    "Autocorrect changed 'patient history' to 'patient mystery' and honestly that's more accurate. 🔍",
    "You know it's going to be a long day when the first patient arrives with a binder. 📁",
    "'Just a quick question' has never once been a quick question. Never. ⏰",
    "I have a joke about prior authorizations but it's still pending approval. 📋",
    "What do you call a bear with no teeth? A gummy bear. And probably a dental referral. 🐻",
    "HIPAA walks into a bar. I can't tell you the rest. 🤐",
];

const WELLNESS_TIPS = [
    "💧 Stay hydrated! Aim for at least 8 glasses of water during your shift.",
    "🧘 Take 3 deep breaths between patients — it resets your nervous system.",
    "🥗 Pack healthy snacks. Your future self will thank your past self.",
    "👟 Invest in good shoes. Your feet carry you through miracles every day.",
    "😊 Smile at a coworker today — it's contagious in the best way.",
    "🛌 Prioritize sleep. A rested caregiver is a safer caregiver.",
    "📵 Take a real break. Step away from screens for 10 minutes.",
    "🤝 Ask a colleague how they're really doing today.",
    "🎧 Music between shifts can reset your mood. Try it!",
    "✨ Celebrate small wins — every successful IV start counts!",
    "🧴 Don't forget to moisturize those hands after all that sanitizer.",
    "📖 Learn one new thing today, no matter how small.",
];

function getDayOfYear() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function ShoutOutBoard() {
    const [shoutOuts, setShoutOuts] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [authorName, setAuthorName] = useState('');
    const [useDb, setUseDb] = useState(true);

    const loadShoutOuts = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('shout_outs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);
            if (error) throw error;
            setShoutOuts(data || []);
            setUseDb(true);
        } catch {
            // Table doesn't exist yet — fall back to localStorage
            setUseDb(false);
            try {
                setShoutOuts(JSON.parse(localStorage.getItem('chc_shoutouts') || '[]'));
            } catch { setShoutOuts([]); }
        }
    }, []);

    useEffect(() => { loadShoutOuts(); }, [loadShoutOuts]);

    const addShoutOut = async () => {
        if (!newMessage.trim()) return;
        const entry = {
            message: newMessage.trim(),
            author: authorName.trim() || 'Anonymous',
        };
        if (useDb) {
            try {
                const { error } = await supabase.from('shout_outs').insert(entry);
                if (error) throw error;
                await loadShoutOuts();
            } catch {
                // fallback
                const local = { ...entry, id: Date.now(), created_at: new Date().toISOString() };
                const updated = [local, ...shoutOuts].slice(0, 20);
                setShoutOuts(updated);
                localStorage.setItem('chc_shoutouts', JSON.stringify(updated));
            }
        } else {
            const local = { ...entry, id: Date.now(), created_at: new Date().toISOString() };
            const updated = [local, ...shoutOuts].slice(0, 20);
            setShoutOuts(updated);
            localStorage.setItem('chc_shoutouts', JSON.stringify(updated));
        }
        setNewMessage('');
        setAuthorName('');
    };

    return (
        <div className="bg-gradient-to-r from-[#FCF0F4] via-white to-[#E8F0FA] rounded-2xl p-6 shadow-md border border-[#E8A0B5]/20">
            <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-[#F9E0EA] rounded-xl flex items-center justify-center">
                    <Award className="w-5 h-5 text-[#E8A0B5]" />
                </div>
                <h3 className="text-lg font-bold text-[#3A6B8C]">Team Shout-Out Board</h3>
                <Sparkles className="w-4 h-4 text-[#6B9FCC]" />
            </div>

            {/* Submit a shout-out */}
            <div className="bg-white rounded-xl p-4 mb-4 border border-[#B8D4E8]/30">
                <div className="flex gap-3 mb-3">
                    <input
                        type="text"
                        placeholder="Your name (optional)"
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                        className="flex-shrink-0 w-40 border border-[#B8D4E8]/50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#6B9FCC] focus:outline-none"
                    />
                    <input
                        type="text"
                        placeholder="Give a shout-out to a teammate! 💗"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addShoutOut()}
                        className="flex-1 border border-[#B8D4E8]/50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#6B9FCC] focus:outline-none"
                    />
                    <button
                        onClick={addShoutOut}
                        className="px-4 py-2 bg-[#E8A0B5] hover:bg-[#D48BA3] text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                    >
                        <Send className="w-4 h-4" /> Post
                    </button>
                </div>
            </div>

            {/* Shout-out messages */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
                {shoutOuts.length === 0 ? (
                    <div className="bg-white/70 rounded-xl p-5 text-center">
                        <Heart className="w-8 h-8 text-[#E8A0B5] mx-auto mb-2" />
                        <p className="text-[#3A6B8C] text-base font-medium">
                            Be the first to give a shout-out! 💗
                        </p>
                        <p className="text-sm text-gray-400 mt-1">Recognize a teammate who made your day.</p>
                    </div>
                ) : (
                    shoutOuts.map((s) => (
                        <div key={s.id} className="bg-white/70 rounded-xl px-4 py-3 flex items-start gap-3">
                            <MessageCircle className="w-5 h-5 text-[#E8A0B5] flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-[#3A6B8C]">{s.message}</p>
                                <p className="text-xs text-gray-400 mt-1">— {s.author} · {s.created_at ? new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default function Home() {
    const dayOfYear = getDayOfYear();
    const todayQuote = MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
    const todayJoke = DAILY_JOKES[dayOfYear % DAILY_JOKES.length];
    const todayTip = WELLNESS_TIPS[dayOfYear % WELLNESS_TIPS.length];

    // Floating medical emoji rain
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animId;
        const emojis = ['💊', '🩺', '❤️', '💉', '🩹', '✨', '🌡️', '💗', '🧬', '🫀'];
        const resize = () => {
            const parent = canvas.parentElement;
            canvas.width = parent.offsetWidth;
            canvas.height = parent.offsetHeight;
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(canvas.parentElement);

        const particles = Array.from({ length: 20 }, () => ({
            x: Math.random() * 2000,
            y: Math.random() * -2000 - 40,
            speed: 0.3 + Math.random() * 0.8,
            size: 14 + Math.random() * 14,
            opacity: 0.06 + Math.random() * 0.1,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.003 + Math.random() * 0.01,
            emoji: emojis[Math.floor(Math.random() * emojis.length)],
        }));

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (const p of particles) {
                p.y += p.speed;
                p.wobble += p.wobbleSpeed;
                const wx = p.x + Math.sin(p.wobble) * 25;
                if (p.y > canvas.height + 40) {
                    p.y = -40 - Math.random() * 150;
                    p.x = Math.random() * canvas.width;
                    p.emoji = emojis[Math.floor(Math.random() * emojis.length)];
                }
                ctx.save();
                ctx.globalAlpha = p.opacity;
                ctx.font = `${p.size}px serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(p.emoji, wx, p.y);
                ctx.restore();
            }
            animId = requestAnimationFrame(animate);
        };
        animId = requestAnimationFrame(animate);
        return () => { cancelAnimationFrame(animId); ro.disconnect(); };
    }, []);

    return (
        <div className="space-y-8 relative">
            <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }} />
            {/* Hero Banner with Resource Cards */}
            <div className="bg-gradient-to-r from-[#6B9FCC] via-[#7BAFD4] to-[#E8A0B5] rounded-3xl p-8 md:p-10 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-md">
                            <Stethoscope className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white">
                                CHC Hub
                            </h1>
                            <p className="text-base text-white/80 mt-0.5">
                                Step-by-step care made simple
                            </p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center space-x-2 text-sm text-white/70">
                        <span>✨</span>
                        <span>Powered by AI</span>
                    </div>
                </div>

                {/* Resource Cards inside banner */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {[
                        { title: "Resource Library", desc: "Education, aftercare & consent forms", icon: BookOpen, path: "Library" },
                        { title: "Pricing", desc: "Procedures, products & packages", icon: DollarSign, path: "PricingManagement" },
                        { title: "Checkout Quote", desc: "Generate price quotes", icon: FileText, path: "CheckoutQuote" },
                        { title: "Inventory", desc: "Supplies, meds & equipment", icon: Package, path: "InventoryManagement" },
                        { title: "Lab Tests", desc: "Quest Diagnostics directory", icon: TestTube, path: "LabTestDirectory" },
                        { title: "FAQs & Questions", desc: "Browse FAQs or submit questions", icon: MessageSquare, path: "FAQ" },
                        { title: "Skin Analysis", desc: "AI-powered skin assessment", icon: Camera, path: "SkinAnalysis", ai: true },
                        { title: "Tanita Analysis", desc: "Body composition comparison", icon: Scale, path: "TanitaCalculator" },
                    ].map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link key={item.path} to={createPageUrl(item.path)}>
                                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 hover:bg-white/30 transition-all duration-200 cursor-pointer group relative h-full">
                                    {item.ai && (
                                        <span className="absolute top-1.5 right-1.5 bg-white/70 text-[#D48BA3] text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                            <Sparkles className="w-2.5 h-2.5" /> AI
                                        </span>
                                    )}
                                    <div className="flex flex-col items-center text-center space-y-1.5">
                                        <div className="w-10 h-10 bg-white/50 rounded-lg flex items-center justify-center shadow-sm group-hover:bg-white/70 transition-colors">
                                            <Icon className="w-5 h-5 text-[#3A6B8C]" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white drop-shadow-sm leading-tight">{item.title}</h3>
                                            <p className="text-[11px] text-white/90 drop-shadow-sm leading-tight mt-0.5">{item.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Announcements */}
            <Announcements />

            {/* Daily Motivation + Daily Laugh Row */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Daily Motivation Banner */}
                <div className="bg-white rounded-2xl p-6 shadow-md border border-[#B8D4E8]/40 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#6B9FCC]/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-[#E8F0FA] rounded-xl flex items-center justify-center">
                                <Quote className="w-5 h-5 text-[#6B9FCC]" />
                            </div>
                            <h3 className="text-lg font-bold text-[#3A6B8C]">Daily Inspiration</h3>
                            <Sparkles className="w-4 h-4 text-[#E8A0B5]" />
                        </div>
                        <blockquote className="text-[#3A6B8C] text-base leading-relaxed italic">
                            "{todayQuote.text}"
                        </blockquote>
                        {todayQuote.author && (
                            <p className="text-sm text-[#6B9FCC] mt-2 font-medium">— {todayQuote.author}</p>
                        )}
                    </div>
                </div>

                {/* Daily Laugh Card */}
                <div className="bg-gradient-to-br from-[#FCF0F4] to-white rounded-2xl p-6 shadow-md border border-[#E8A0B5]/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#E8A0B5]/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-[#F9E0EA] rounded-xl flex items-center justify-center">
                                <Smile className="w-5 h-5 text-[#D48BA3]" />
                            </div>
                            <h3 className="text-lg font-bold text-[#3A6B8C]">Daily Laugh</h3>
                            <span className="text-sm">😂</span>
                        </div>
                        <p className="text-[#3A6B8C] text-base leading-relaxed">
                            {todayJoke}
                        </p>
                        <p className="text-xs text-[#E8A0B5] mt-3 font-medium">A little humor makes the shift brighter ✨</p>
                    </div>
                </div>
            </div>

            {/* Wellness Tip */}
            <div className="bg-white rounded-2xl p-5 shadow-md border border-[#E8A0B5]/30 flex items-center gap-4">
                <div className="w-12 h-12 bg-[#F9E0EA] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-6 h-6 text-[#E8A0B5]" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-[#3A6B8C] mb-0.5">Wellness Tip of the Day</h4>
                    <p className="text-sm text-[#3A6B8C] leading-snug">{todayTip}</p>
                </div>
            </div>

            {/* Shout-Out Board */}
            <ShoutOutBoard />


        </div>
    );
}
