import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import { 
            BookOpen, 
            FileText, 
            Building2, 
            DollarSign, 
            Home,
            Menu,
            X,
            Stethoscope,
            Users,
            Package,
            Tag,
            MessageSquare,
            Layers
        } from "lucide-react";

export default function Layout({ children, currentPageName }) {
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
    const [currentUser, setCurrentUser] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);

    console.log('=== LAYOUT RENDER ===');
    console.log('currentPageName:', currentPageName);
    console.log('Is ViewSharedForm?', currentPageName === "ViewSharedForm");

    // If this is ViewSharedForm, render immediately without layout
    if (currentPageName === "ViewSharedForm") {
        console.log('Rendering ViewSharedForm without layout');
        return <>{children}</>;
    }

    React.useEffect(() => {
        base44.auth.me()
            .then(user => {
                setCurrentUser(user);
                setIsLoading(false);
            })
            .catch(() => {
                // Redirect to login if not authenticated - include hash for hash-based routing
                const redirectUrl = window.location.pathname + window.location.search + window.location.hash;
                base44.auth.redirectToLogin(redirectUrl);
            });
    }, [currentPageName]);

    const navItems = [
        { name: "Home", path: "Home", icon: Home },
        { name: "Messaging", path: "Messaging", icon: MessageSquare },
        { name: "Education Library", path: "EducationLibrary", icon: BookOpen },
        { name: "Aftercare & Forms", path: "AftercareLibrary", icon: FileText },
        { name: "Form Templates", path: "FormTemplates", icon: Layers },
        { name: "Clinic Directory", path: "ClinicDirectory", icon: Building2 },
        { name: "Pricing", path: "PricingManagement", icon: DollarSign },
        { name: "Quotes", path: "QuotesManagement", icon: FileText },
        { name: "Inventory", path: "InventoryManagement", icon: Package },
        ...(currentUser?.role === 'admin' || currentUser?.role === 'manager' ? [{ name: "Discounts", path: "DiscountManagement", icon: Tag }] : []),
        ...(currentUser?.role === 'admin' ? [{ name: "Users", path: "UserManagement", icon: Users }] : []),
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-blue-50 to-cyan-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-cyan-100">
            <style>
                {`
                    :root {
                        --primary: #8b5cf6;
                        --primary-light: #ede9fe;
                        --primary-dark: #6d28d9;
                        --accent: #06b6d4;
                    }
                `}
            </style>
            
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-purple-200/50 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo */}
                        <Link to={createPageUrl("Home")} className="flex items-center space-x-3">
                            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-md">
                                <Stethoscope className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900">CHC Hub</div>
                                <div className="text-sm text-purple-600">Step-by-step care made simple</div>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center space-x-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = currentPageName === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={createPageUrl(item.path)}
                                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                            isActive
                                                ? "bg-white shadow-md text-purple-900"
                                                : "text-gray-600 hover:bg-white/50 hover:text-gray-900"
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-slate-100"
                        >
                            {mobileMenuOpen ? (
                                <X className="w-6 h-6 text-gray-600" />
                            ) : (
                                <Menu className="w-6 h-6 text-gray-600" />
                            )}
                        </button>
                    </div>

                    {/* Mobile Navigation */}
                    {mobileMenuOpen && (
                        <div className="md:hidden py-4 border-t border-slate-200">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = currentPageName === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={createPageUrl(item.path)}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium ${
                                            isActive
                                                ? "bg-purple-50 text-purple-900 border-l-4 border-purple-600"
                                                : "text-gray-600 hover:bg-purple-50"
                                        }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-white/80 backdrop-blur-md border-t border-purple-200/50 mt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center text-sm text-gray-600">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                            <span>✨ Powered by AI</span>
                        </div>
                        <p>© {new Date().getFullYear()} CHC Hub. All rights reserved.</p>
                        <p className="mt-1">For internal staff use only</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}