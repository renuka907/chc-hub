import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    BookOpen, 
    FileText, 
    Building2, 
    DollarSign,
    Stethoscope,
    Package,
    MessageSquare,
    Tag,
    Users,
    Layers,
    HelpCircle,
    ArrowRight
} from "lucide-react";

export default function Home() {
    const navigationSections = [
        {
            title: "Clinical Resources",
            color: "purple",
            items: [
                { title: "Procedures", description: "Step-by-step clinical guides", icon: Stethoscope, path: "ProceduresManagement" },
                { title: "Lab Tests", description: "Quest diagnostic directory", icon: Stethoscope, path: "LabTestDirectory" },
                { title: "Aftercare & Forms", description: "Patient instructions & consent", icon: FileText, path: "AftercareLibrary" },
                { title: "Form Templates", description: "Reusable form library", icon: Layers, path: "FormTemplates" },
            ]
        },
        {
            title: "Business Operations",
            color: "emerald",
            items: [
                { title: "Pricing", description: "Services & treatment packages", icon: DollarSign, path: "PricingManagement" },
                { title: "Quotes", description: "Patient pricing quotes", icon: FileText, path: "QuotesManagement" },
                { title: "Discounts", description: "Promotions & special offers", icon: Tag, path: "DiscountManagement" },
                { title: "Clinic Directory", description: "Location management", icon: Building2, path: "ClinicDirectory" },
            ]
        },
        {
            title: "Management & Support",
            color: "blue",
            items: [
                { title: "Inventory", description: "Supplies & stock tracking", icon: Package, path: "InventoryManagement" },
                { title: "Education Library", description: "Patient education resources", icon: BookOpen, path: "EducationLibrary" },
                { title: "Messaging", description: "Team communication hub", icon: MessageSquare, path: "Messaging" },
                { title: "Users", description: "Staff & access management", icon: Users, path: "UserManagement" },
            ]
        },
    ];

    const getColorClasses = (color) => {
        const colors = {
            purple: { bg: "from-purple-500 to-purple-600", border: "border-purple-200 hover:border-purple-400" },
            emerald: { bg: "from-emerald-500 to-emerald-600", border: "border-emerald-200 hover:border-emerald-400" },
            blue: { bg: "from-blue-500 to-blue-600", border: "border-blue-200 hover:border-blue-400" },
        };
        return colors[color];
    };

    return (
        <div className="space-y-8">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-blue-500 rounded-2xl p-8 text-white shadow-xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Welcome to CHC Hub</h1>
                        <p className="text-lg text-purple-100">Your comprehensive clinic management platform</p>
                    </div>
                    <div className="hidden md:block">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                            <Stethoscope className="w-8 h-8 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Sections */}
            {navigationSections.map((section) => {
                const colors = getColorClasses(section.color);
                return (
                    <div key={section.title} className="space-y-4">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                            <Badge variant="outline" className="text-xs">{section.items.length} modules</Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link key={item.path} to={createPageUrl(item.path)} className="group">
                                        <Card className={`h-full hover:shadow-lg transition-all duration-300 border-2 ${colors.border}`}>
                                            <CardContent className="p-6">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className={`p-3 rounded-xl bg-gradient-to-br ${colors.bg} text-white`}>
                                                        <Icon className="w-6 h-6" />
                                                    </div>
                                                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-1 transition-all" />
                                                </div>
                                                <h3 className="font-bold text-lg text-gray-900 mb-2">{item.title}</h3>
                                                <p className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                                                    {item.description}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {/* Quick Help */}
            <Link to={createPageUrl("FAQ")} className="group">
                <Card className="hover:shadow-lg transition-all duration-300 border-2 border-gray-200 hover:border-gray-400">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 text-white">
                                <HelpCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">Need Help?</h3>
                                <p className="text-sm text-gray-600">View frequently asked questions</p>
                            </div>
                        </div>
                        <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-1 transition-all" />
                    </CardContent>
                </Card>
            </Link>
        </div>
    );
}