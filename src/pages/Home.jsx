import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { 
    BookOpen, 
    FileText, 
    Building2, 
    DollarSign,
    Stethoscope,
    Package,
    MessageSquare,
    TestTube
} from "lucide-react";

export default function Home() {
    const quickLinks = [
        {
            title: "Resource Library",
            description: "Access education materials, aftercare instructions, and consent forms",
            icon: BookOpen,
            path: "Library",
            color: "from-purple-500 to-violet-600"
        },
        {
            title: "Pricing",
            description: "Manage pricing for procedures, products, and packages",
            icon: DollarSign,
            path: "PricingManagement",
            color: "from-violet-500 to-purple-600"
        },
        {
            title: "Checkout Quote",
            description: "Generate price quotes for procedures and products",
            icon: DollarSign,
            path: "CheckoutQuote",
            color: "from-fuchsia-500 to-pink-600"
        },
    ];

    return (
        <div className="space-y-8">
            <div className="bg-gradient-to-r from-purple-200 via-blue-100 to-cyan-200 rounded-3xl p-8 md:p-12 shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-md">
                            <Stethoscope className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                                CHC Hub
                            </h1>
                            <p className="text-lg text-purple-700 mt-1">
                                Step-by-step care made simple
                            </p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center space-x-2 text-sm text-gray-700">
                        <span>✨</span>
                        <span>Powered by AI</span>
                    </div>
                </div>
            </div>

            {/* Choose Section Header */}
            <div className="bg-white rounded-3xl p-6 shadow-md">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Choose Resource Category</h2>
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickLinks.map((link) => {
                    const Icon = link.icon;
                    const gradientMap = {
                        "from-purple-500 to-violet-600": "from-green-200 to-green-300",
                        "from-cyan-500 to-blue-600": "from-blue-200 to-blue-300",
                        "from-violet-500 to-purple-600": "from-purple-200 to-pink-300",
                        "from-fuchsia-500 to-pink-600": "from-orange-200 to-orange-300"
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
                                <div className="flex flex-col items-center text-center space-y-4">
                                    <div className="w-16 h-16 bg-white/60 rounded-2xl flex items-center justify-center shadow-sm">
                                        <Icon className="w-8 h-8 text-gray-700" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                                            {link.title}
                                        </h3>
                                        <p className="text-sm text-gray-700">
                                            {link.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    );
                })}

                <Link to={createPageUrl("InventoryManagement")}>
                    <div className="h-full bg-gradient-to-br from-orange-200 to-amber-300 rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer relative overflow-hidden">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-8 h-8 bg-white/50 rounded-full flex items-center justify-center">
                                <span className="text-lg">✓</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 bg-white/60 rounded-2xl flex items-center justify-center shadow-sm">
                                <Package className="w-8 h-8 text-gray-700" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    Inventory
                                </h3>
                                <p className="text-sm text-gray-700">
                                    Track supplies, medications, and equipment
                                </p>
                            </div>
                        </div>
                    </div>
                </Link>

                <Link to={createPageUrl("FAQ")}>
                    <div className="h-full bg-gradient-to-br from-blue-200 to-cyan-300 rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer relative overflow-hidden">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-8 h-8 bg-white/50 rounded-full flex items-center justify-center">
                                <span className="text-lg">✓</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 bg-white/60 rounded-2xl flex items-center justify-center shadow-sm">
                                <MessageSquare className="w-8 h-8 text-gray-700" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    FAQs & Questions
                                </h3>
                                <p className="text-sm text-gray-700">
                                    Browse FAQs or submit questions
                                </p>
                            </div>
                        </div>
                    </div>
                </Link>
            </div>


        </div>
    );
}