import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
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
            Layers,
            LogOut,
            ChevronDown,
            Sparkles,
            Bell
        } from "lucide-react";

export default function Layout({ children, currentPageName }) {
    // Check if this is a public page immediately - before any state or effects
    const hash = window.location.hash;
    const isPublicPage = currentPageName === "ViewSharedForm" || 
                        hash.includes('ViewSharedForm') ||
                        hash.includes('token=');
    
    // If public page, render immediately without any auth or layout
    if (isPublicPage) {
        return <div className="min-h-screen">{children}</div>;
    }
    
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
    const [openDropdown, setOpenDropdown] = React.useState(null);

    const { data: currentUser } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: false
    });

    const menuGroups = [
        {
            name: "Home",
            path: "Home",
            icon: Home,
            single: true
        },
        {
            name: "Messaging",
            path: "Messaging",
            icon: MessageSquare,
            single: true
        },
        {
            name: "Clinical",
            icon: Stethoscope,
            items: [
                { name: "Procedures", path: "ProceduresManagement", icon: Stethoscope },
                { name: "Lab Tests", path: "LabTestDirectory", icon: Stethoscope },
                { name: "Education Library", path: "EducationLibrary", icon: BookOpen },
            ]
        },
        {
            name: "Forms & Documents",
            icon: FileText,
            items: [
                { name: "Aftercare & Consents", path: "AftercareLibrary", icon: FileText },
                { name: "Form Templates", path: "FormTemplates", icon: Layers },
            ]
        },
        {
            name: "Business",
            icon: DollarSign,
            items: [
                { name: "Clinic Directory", path: "ClinicDirectory", icon: Building2 },
                { name: "Pricing", path: "PricingManagement", icon: DollarSign },
                { name: "Quotes", path: "QuotesManagement", icon: FileText },
                { name: "Inventory", path: "InventoryManagement", icon: Package },
                ...(currentUser?.role === 'admin' || currentUser?.role === 'manager' ? [{ name: "Discounts", path: "DiscountManagement", icon: Tag }] : []),
            ]
        },
        ...(currentUser?.role === 'admin' ? [{
            name: "Admin",
            icon: Users,
            items: [
                { name: "User Management", path: "UserManagement", icon: Users },
            ]
        }] : []),
    ];

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
                            </div>
                        </Link>

                        {/* Quick Action Buttons and Menu */}
                        <div className="hidden md:flex items-center gap-2">
                            <Link 
                                to={createPageUrl("Home")} 
                                className="flex items-center gap-2 bg-white border-2 border-purple-300 text-purple-700 px-4 py-2 rounded-lg hover:shadow-lg transition-all font-medium"
                            >
                                <Home className="w-4 h-4" />
                                <span>Home</span>
                            </Link>
                            <Link 
                                to={createPageUrl("Messaging")} 
                                className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all font-medium"
                            >
                                <Sparkles className="w-4 h-4" />
                                <span>Chat with Peach</span>
                            </Link>
                            <Link 
                                to={createPageUrl("Messaging")} 
                                className="flex items-center gap-2 bg-white border-2 border-purple-300 text-purple-700 px-4 py-2 rounded-lg hover:shadow-lg transition-all font-medium"
                            >
                                <Bell className="w-4 h-4" />
                                <span>Reminders</span>
                            </Link>
                            
                            {/* Single Dropdown Menu */}
                            <div className="relative">
                                <button
                                    onMouseEnter={() => setOpenDropdown(0)}
                                    onMouseLeave={() => setOpenDropdown(null)}
                                    className="flex items-center gap-2 bg-white border-2 border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:shadow-lg transition-all font-medium"
                                >
                                    <Menu className="w-4 h-4" />
                                    <span>Menu</span>
                                    <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === 0 ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {openDropdown === 0 && (
                                    <div 
                                        onMouseEnter={() => setOpenDropdown(0)}
                                        onMouseLeave={() => setOpenDropdown(null)}
                                        className="absolute top-full right-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                                    >
                                        {menuGroups.map((group, idx) => {
                                            if (group.single) {
                                                const Icon = group.icon;
                                                const isActive = currentPageName === group.path;
                                                return (
                                                    <Link
                                                        key={group.path}
                                                        to={createPageUrl(group.path)}
                                                        className={`flex items-center space-x-3 px-4 py-2 text-sm transition-colors ${
                                                            isActive
                                                                ? "bg-purple-50 text-purple-900 font-medium"
                                                                : "text-gray-700 hover:bg-gray-50"
                                                        }`}
                                                    >
                                                        <Icon className="w-4 h-4" />
                                                        <span>{group.name}</span>
                                                    </Link>
                                                );
                                            }
                                            
                                            return (
                                                <div key={idx}>
                                                    <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-2">
                                                        {group.name}
                                                    </div>
                                                    {group.items.map((item) => {
                                                        const ItemIcon = item.icon;
                                                        const isActive = currentPageName === item.path;
                                                        return (
                                                            <Link
                                                                key={item.path}
                                                                to={createPageUrl(item.path)}
                                                                className={`flex items-center space-x-3 px-6 py-2 text-sm transition-colors ${
                                                                    isActive
                                                                        ? "bg-purple-50 text-purple-900 font-medium"
                                                                        : "text-gray-700 hover:bg-gray-50"
                                                                }`}
                                                            >
                                                                <ItemIcon className="w-4 h-4" />
                                                                <span>{item.name}</span>
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                        <div className="border-t mt-2 pt-2">
                                            <button
                                                onClick={() => base44.auth.logout()}
                                                className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full transition-colors"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                <span>Sign Out</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
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
                        <div className="lg:hidden py-4 border-t border-slate-200">
                            {menuGroups.map((group, idx) => {
                                if (group.single) {
                                    const Icon = group.icon;
                                    const isActive = currentPageName === group.path;
                                    return (
                                        <Link
                                            key={group.path}
                                            to={createPageUrl(group.path)}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium ${
                                                isActive
                                                    ? "bg-purple-50 text-purple-900 border-l-4 border-purple-600"
                                                    : "text-gray-600 hover:bg-purple-50"
                                            }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            <span>{group.name}</span>
                                        </Link>
                                    );
                                }
                                
                                const Icon = group.icon;
                                return (
                                    <div key={idx}>
                                        <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            {group.name}
                                        </div>
                                        {group.items.map((item) => {
                                            const ItemIcon = item.icon;
                                            const isActive = currentPageName === item.path;
                                            return (
                                                <Link
                                                    key={item.path}
                                                    to={createPageUrl(item.path)}
                                                    onClick={() => setMobileMenuOpen(false)}
                                                    className={`flex items-center space-x-3 px-8 py-3 text-sm font-medium ${
                                                        isActive
                                                            ? "bg-purple-50 text-purple-900 border-l-4 border-purple-600"
                                                            : "text-gray-600 hover:bg-purple-50"
                                                    }`}
                                                >
                                                    <ItemIcon className="w-4 h-4" />
                                                    <span>{item.name}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                            <button
                                onClick={() => base44.auth.logout()}
                                className="flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-purple-50 w-full mt-2"
                            >
                                <LogOut className="w-5 h-5" />
                                <span>Sign Out</span>
                            </button>
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