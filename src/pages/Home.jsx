import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import Announcements from "@/components/Announcements";
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
    Star,
    Award,
    Trophy,
    Users,
    Lightbulb,
    Smile,
    Quote
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
    "Why did the nurse bring a red pen to work? In case they needed to draw blood. 🩸",
    "What did the doctor say to the tonsil? 'You better get dressed — we're going out!' 👋",
    "I told my patients I'm outstanding in my field. They said, 'Please come back inside, we need you.' 🌾",
    "What's the difference between a nurse and a therapist? A nurse says 'This won't hurt a bit.' A therapist says 'Tell me where it hurts.' 💬",
    "Why do nurses make great comedians? Because they know all the best veins of humor. 😄",
    "What did one blood cell say to the other? 'I love working with you — we've got great chemistry!' ❤️",
    "Autocorrect changed 'patient history' to 'patient mystery' and honestly, that's more accurate. 🔍",
    "Why did the doctor carry a red marker? For emergency situations — they needed to draw blood! 🖊️",
    "What do you call a doctor who fixes websites? A URLologist. 💻",
    "I asked the nurse if I could administer my own anesthesia. She said, 'Sure, knock yourself out.' 😴",
    "Why did the melon go to the hospital? Because it wasn't peeling well. 🍈",
    "What did the stamp say to the envelope? 'Stick with me and we'll go places!' — basically every preceptor ever. 📬",
    "My stethoscope isn't working. I think it's a heart-ware issue. 🩺",
    "Why do healthcare workers make terrible secret agents? They always check your vitals. 🕵️",
    "Patient: 'Doctor, I feel like a pair of curtains.' Doctor: 'Pull yourself together!' 🪟",
    "What's a nurse's favorite type of music? Organ music, obviously. 🎵",
    "Why did the skeleton go to the party alone? Because he had no body to go with. 💀",
    "I told the X-ray tech a joke. She saw right through it. 📸",
    "What do you call a fake noodle? An impasta. What do you call a fake doctor? We don't joke about that — verify credentials, people. 📋",
    "Why did the nurse tiptoe past the medicine cabinet? She didn't want to wake the sleeping pills. 💊",
    "What's a blood type's favorite pickup line? 'Are you type O? Because you're universally attractive.' 🅾️",
    "Doctor: 'You need to stop using Q-tips.' Patient: 'Why?' Doctor: 'I said STOP — Q-tip lodged, can't hear me.' 👂",
    "Why don't scientists trust atoms? Because they make up everything — kind of like patient intake forms. 📝",
    "What did the left eye say to the right eye? 'Between us, something smells.' 👃",
    "A nurse's favorite exercise? Running out of patience. Just kidding — running late. 🏃",
    "Why did the medical chart break up with the pen? It felt too much was being written behind its back. ✍️",
    "What's the most musical bone? The trom-bone. 🎺",
    "I have a great joke about EHR systems but it takes 45 minutes to log in and tell it. 🖥️",
    "Why did the bandage go to school? Because it wanted to be a little more well-rounded. 🩹",
    "How do you make a tissue dance? Put a little boogie in it. 🕺",
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

export default function Home() {
    const dayOfYear = getDayOfYear();
    const todayQuote = MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
    const todayJoke = DAILY_JOKES[dayOfYear % DAILY_JOKES.length];
    const todayTip = WELLNESS_TIPS[dayOfYear % WELLNESS_TIPS.length];

    const quickLinks = [
        {
            title: "Resource Library",
            description: "Access education materials, aftercare instructions, and consent forms",
            icon: BookOpen,
            path: "Library",
            color: "from-[#6B9FCC] to-[#5889B5]"
        },
        {
            title: "Pricing",
            description: "Manage pricing for procedures, products, and packages",
            icon: DollarSign,
            path: "PricingManagement",
            color: "from-[#7BAFD4] to-[#6B9FCC]"
        },
        {
            title: "Checkout Quote",
            description: "Generate price quotes for procedures and products",
            icon: DollarSign,
            path: "CheckoutQuote",
            color: "from-[#E8A0B5] to-[#D48BA3]"
        },
    ];

    return (
        <div className="space-y-8">
            {/* Hero Banner */}
            <div className="bg-gradient-to-r from-[#6B9FCC] via-[#7BAFD4] to-[#E8A0B5] rounded-3xl p-8 md:p-12 shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-md">
                            <Stethoscope className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold text-white">
                                CHC Hub
                            </h1>
                            <p className="text-lg text-white/80 mt-1">
                                Step-by-step care made simple
                            </p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center space-x-2 text-sm text-white/70">
                        <span>✨</span>
                        <span>Powered by AI</span>
                    </div>
                </div>
            </div>

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

            {/* Team Stats / Recognition Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Tasks Completed */}
                <div className="bg-white rounded-2xl p-5 shadow-md border border-[#B8D4E8]/40 text-center">
                    <div className="w-12 h-12 bg-[#E8F0FA] rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Trophy className="w-6 h-6 text-[#6B9FCC]" />
                    </div>
                    <div className="text-3xl font-bold text-[#3A6B8C]">—</div>
                    <p className="text-sm text-gray-500 mt-1">Tasks This Week</p>
                </div>

                {/* Team Member of the Week */}
                <div className="bg-white rounded-2xl p-5 shadow-md border border-[#E8A0B5]/30 text-center">
                    <div className="w-12 h-12 bg-[#F9E0EA] rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Star className="w-6 h-6 text-[#E8A0B5]" />
                    </div>
                    <div className="text-lg font-bold text-[#3A6B8C]">⭐ TBD</div>
                    <p className="text-sm text-gray-500 mt-1">Star of the Week</p>
                </div>

                {/* Patient Satisfaction */}
                <div className="bg-white rounded-2xl p-5 shadow-md border border-[#B8D4E8]/40 text-center">
                    <div className="w-12 h-12 bg-[#E8F0FA] rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Heart className="w-6 h-6 text-[#6B9FCC]" />
                    </div>
                    <div className="text-3xl font-bold text-[#3A6B8C]">—</div>
                    <p className="text-sm text-gray-500 mt-1">Patient Satisfaction</p>
                </div>

                {/* Quick Wellness Tip */}
                <div className="bg-white rounded-2xl p-5 shadow-md border border-[#E8A0B5]/30 text-center">
                    <div className="w-12 h-12 bg-[#F9E0EA] rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Lightbulb className="w-6 h-6 text-[#E8A0B5]" />
                    </div>
                    <p className="text-sm text-[#3A6B8C] font-medium leading-snug">{todayTip}</p>
                </div>
            </div>

            {/* Shout-Out Board */}
            <div className="bg-gradient-to-r from-[#FCF0F4] via-white to-[#E8F0FA] rounded-2xl p-6 shadow-md border border-[#E8A0B5]/20">
                <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-[#F9E0EA] rounded-xl flex items-center justify-center">
                        <Award className="w-5 h-5 text-[#E8A0B5]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#3A6B8C]">Team Shout-Out Board</h3>
                    <Sparkles className="w-4 h-4 text-[#6B9FCC]" />
                </div>
                <div className="bg-white/70 rounded-xl p-5 text-center">
                    <Heart className="w-8 h-8 text-[#E8A0B5] mx-auto mb-2" />
                    <p className="text-[#3A6B8C] text-lg font-medium">
                        Thank you for showing up every day with heart and dedication. 💗
                    </p>
                    <p className="text-sm text-gray-400 mt-2">You make this clinic a better place — one patient, one smile, one moment at a time.</p>
                </div>
            </div>

            {/* Announcements */}
            <Announcements />

            {/* Choose Section Header */}
            <div className="bg-white rounded-3xl p-6 shadow-md border border-[#B8D4E8]/40">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#E8F0FA] rounded-xl flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-[#6B9FCC]" />
                    </div>
                    <h2 className="text-2xl font-bold text-[#3A6B8C]">Choose Resource Category</h2>
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickLinks.map((link) => {
                    const Icon = link.icon;
                    const gradientMap = {
                        "from-[#6B9FCC] to-[#5889B5]": "from-[#D4E6F5] to-[#B8D4E8]",
                        "from-[#7BAFD4] to-[#6B9FCC]": "from-[#D4E6F5] to-[#E8F0FA]",
                        "from-[#E8A0B5] to-[#D48BA3]": "from-[#F9E0EA] to-[#F0C8D6]"
                    };
                    const bgGradient = gradientMap[link.color] || "from-gray-200 to-gray-300";
                    
                    return (
                        <Link key={link.path} to={createPageUrl(link.path)}>
                            <div className={`h-full bg-gradient-to-br ${bgGradient} rounded-2xl p-4 shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer relative overflow-hidden`}>
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="w-8 h-8 bg-white/50 rounded-full flex items-center justify-center">
                                        <span className="text-lg">✓</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center text-center space-y-2">
                                    <div className="w-12 h-12 bg-white/60 rounded-xl flex items-center justify-center shadow-sm">
                                        <Icon className="w-6 h-6 text-[#3A6B8C]" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-[#3A6B8C] mb-1">
                                            {link.title}
                                        </h3>
                                        <p className="text-xs text-gray-600">
                                            {link.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    );
                })}

                <Link to={createPageUrl("InventoryManagement")}>
                    <div className="h-full bg-gradient-to-br from-[#F5DEB3] to-[#F0C88C] rounded-2xl p-4 shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer relative overflow-hidden">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-8 h-8 bg-white/50 rounded-full flex items-center justify-center">
                                <span className="text-lg">✓</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-center text-center space-y-2">
                            <div className="w-12 h-12 bg-white/60 rounded-xl flex items-center justify-center shadow-sm">
                                <Package className="w-6 h-6 text-[#3A6B8C]" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-[#3A6B8C] mb-1">
                                    Inventory
                                </h3>
                                <p className="text-xs text-gray-600">
                                    Track supplies, medications, and equipment
                                </p>
                            </div>
                        </div>
                    </div>
                </Link>

                <Link to={createPageUrl("LabTestDirectory")}>
                    <div className="h-full bg-gradient-to-br from-[#F9E0EA] to-[#F0C8D6] rounded-2xl p-4 shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer relative overflow-hidden">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-8 h-8 bg-white/50 rounded-full flex items-center justify-center">
                                <span className="text-lg">✓</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-center text-center space-y-2">
                            <div className="w-12 h-12 bg-white/60 rounded-xl flex items-center justify-center shadow-sm">
                                <TestTube className="w-6 h-6 text-[#3A6B8C]" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-[#3A6B8C] mb-1">
                                    Lab Tests
                                </h3>
                                <p className="text-xs text-gray-600">
                                    Quest Diagnostics test directory
                                </p>
                            </div>
                        </div>
                    </div>
                </Link>

                <Link to={createPageUrl("FAQ")}>
                    <div className="h-full bg-gradient-to-br from-[#D4E6F5] to-[#B8D4E8] rounded-2xl p-4 shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer relative overflow-hidden">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-8 h-8 bg-white/50 rounded-full flex items-center justify-center">
                                <span className="text-lg">✓</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-center text-center space-y-2">
                            <div className="w-12 h-12 bg-white/60 rounded-xl flex items-center justify-center shadow-sm">
                                <MessageSquare className="w-6 h-6 text-[#3A6B8C]" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-[#3A6B8C] mb-1">
                                    FAQs & Questions
                                </h3>
                                <p className="text-xs text-gray-600">
                                    Browse FAQs or submit questions
                                </p>
                            </div>
                        </div>
                    </div>
                </Link>

                <Link to={createPageUrl("SkinAnalysis")}>
                    <div className="h-full bg-gradient-to-br from-[#F0C8D6] to-[#E8A0B5] rounded-2xl p-4 shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer relative overflow-hidden">
                        <div className="absolute top-2 right-2">
                            <span className="bg-white/80 text-[#D48BA3] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> AI
                            </span>
                        </div>
                        <div className="flex flex-col items-center text-center space-y-2">
                            <div className="w-12 h-12 bg-white/60 rounded-xl flex items-center justify-center shadow-sm">
                                <Camera className="w-6 h-6 text-[#3A6B8C]" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-[#3A6B8C] mb-1">
                                    Skin Analysis
                                </h3>
                                <p className="text-xs text-gray-600">
                                    AI-powered skin assessment & recommendations
                                </p>
                            </div>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}
