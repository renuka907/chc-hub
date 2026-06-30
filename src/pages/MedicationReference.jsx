import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer, Pill, Search, Droplets, Zap, Sparkles, Syringe } from "lucide-react";
import { Input } from "@/components/ui/input";

// ─── GLP DOSING CHARTS ───

const semaglutideChart = {
    title: "Semaglutide Dosing Chart",
    subtitle: "5mg/mL Vials — RX Compound Vial",
    color: "from-blue-500 to-cyan-500",
    borderColor: "border-blue-200",
    headerBg: "bg-blue-50",
    accentColor: "text-blue-700",
    rows: [
        { mg: "0.30 mg", units: "6 units", syringe: "Insulin" },
        { mg: "0.60 mg", units: "12 units", syringe: "Insulin" },
        { mg: "1.20 mg", units: "24 units", syringe: "Insulin" },
        { mg: "1.60 mg", units: "32 units", syringe: "Insulin" },
        { mg: "2.65 mg", units: "53 units", syringe: "Insulin" },
    ],
};

const tirzepatideChart = {
    title: "Tirzepatide Dosing Chart",
    subtitle: "15mg/mL Vial — RX Compound Vial",
    updated: "Updated 12/17/25",
    color: "from-purple-500 to-pink-500",
    borderColor: "border-purple-200",
    headerBg: "bg-purple-50",
    accentColor: "text-purple-700",
    rows: [
        { mg: "2 mg", units: "13 units", price: "$125" },
        { mg: "3 mg", units: "20 units", price: "$125" },
        { mg: "4 mg", units: "26 units", price: "$175" },
        { mg: "6 mg", units: "40 units", price: "$175" },
        { mg: "8.50 mg", units: "56 units", price: "$225" },
        { mg: "11 mg", units: "73 units", price: "$225" },
        { mg: "16 mg", units: "1.1 mL", price: "$225" },
    ],
};

const testosteroneChart = {
    title: "Testosterone Dosing Reference",
    subtitle: "Doses 20 mg and higher use the 200 mg/mL vial",
    color: "from-emerald-600 to-teal-600",
    borderColor: "border-emerald-200",
    headerBg: "bg-emerald-50",
    accentColor: "text-emerald-800",
    rows: [
        { dose: "5 mg", concentration: "50 mg/mL", volume: "0.1 mL", units: "10 units" },
        { dose: "10 mg", concentration: "50 mg/mL", volume: "0.2 mL", units: "20 units" },
        { dose: "15 mg", concentration: "50 mg/mL", volume: "0.3 mL", units: "30 units" },
        { dose: "20 mg", concentration: "200 mg/mL", volume: "0.1 mL", units: "10 units" },
        { dose: "25 mg", concentration: "200 mg/mL", volume: "0.125 mL", units: "12.5 units" },
        { dose: "30 mg", concentration: "200 mg/mL", volume: "0.15 mL", units: "15 units" },
        { dose: "35 mg", concentration: "200 mg/mL", volume: "0.175 mL", units: "17.5 units" },
        { dose: "40 mg", concentration: "200 mg/mL", volume: "0.2 mL", units: "20 units" },
        { dose: "45 mg", concentration: "200 mg/mL", volume: "0.225 mL", units: "22.5 units" },
        { dose: "50 mg", concentration: "200 mg/mL", volume: "0.25 mL", units: "25 units" },
    ],
    notes: [
        "The 12.5, 17.5, and 22.5 unit values fall between unit marks on a standard insulin/TB syringe and cannot be measured exactly; round to the nearest half-unit by eye.",
        "For cleaner whole-unit draws at 25 mg, 35 mg, and 45 mg targets, the 50 mg/mL vial is an alternative.",
        "Doses under 20 mg remain on the 50 mg/mL vial because switching them to 200 mg/mL would fall below reliable measurability on the syringe.",
    ],
};

const estradiolChart = {
    title: "Estradiol Dosing Reference",
    subtitle: "Volume to draw up by vial concentration",
    color: "from-rose-600 to-pink-600",
    borderColor: "border-rose-200",
    headerBg: "bg-rose-50",
    accentColor: "text-rose-800",
    rows: [
        { dose: "1 mg", concentration: "5 mg/mL", volume: "0.2 mL", units: "20 units" },
        { dose: "1 mg", concentration: "10 mg/mL", volume: "0.1 mL", units: "10 units" },
        { dose: "1 mg", concentration: "20 mg/mL", volume: "0.05 mL", units: "5 units" },
        { dose: "1.5 mg", concentration: "5 mg/mL", volume: "0.3 mL", units: "30 units" },
        { dose: "1.5 mg", concentration: "10 mg/mL", volume: "0.15 mL", units: "15 units" },
        { dose: "1.5 mg", concentration: "20 mg/mL", volume: "0.075 mL", units: "7.5 units" },
        { dose: "2 mg", concentration: "5 mg/mL", volume: "0.4 mL", units: "40 units" },
        { dose: "2 mg", concentration: "10 mg/mL", volume: "0.2 mL", units: "20 units" },
        { dose: "2 mg", concentration: "20 mg/mL", volume: "0.1 mL", units: "10 units" },
        { dose: "2.5 mg", concentration: "5 mg/mL", volume: "0.5 mL", units: "50 units" },
        { dose: "2.5 mg", concentration: "10 mg/mL", volume: "0.25 mL", units: "25 units" },
        { dose: "2.5 mg", concentration: "20 mg/mL", volume: "0.125 mL", units: "12.5 units" },
        { dose: "3 mg", concentration: "5 mg/mL", volume: "0.6 mL", units: "60 units" },
        { dose: "3 mg", concentration: "10 mg/mL", volume: "0.3 mL", units: "30 units" },
        { dose: "3 mg", concentration: "20 mg/mL", volume: "0.15 mL", units: "15 units" },
        { dose: "3.5 mg", concentration: "5 mg/mL", volume: "0.7 mL", units: "70 units" },
        { dose: "3.5 mg", concentration: "10 mg/mL", volume: "0.35 mL", units: "35 units" },
        { dose: "3.5 mg", concentration: "20 mg/mL", volume: "0.175 mL", units: "17.5 units" },
        { dose: "4 mg", concentration: "5 mg/mL", volume: "0.8 mL", units: "80 units" },
        { dose: "4 mg", concentration: "10 mg/mL", volume: "0.4 mL", units: "40 units" },
        { dose: "4 mg", concentration: "20 mg/mL", volume: "0.2 mL", units: "20 units" },
    ],
    notes: [
        "For half-unit draws such as 7.5, 12.5, and 17.5 units, measure to the nearest half-unit by eye on a 1 mL TB or U-100 syringe.",
    ],
};

// ─── IV INFUSION FORMULAS ───

const ivFormulas = [
    {
        name: "Alleviate",
        icon: "💆",
        sizes: [{
            size: "One Size",
            ingredients: ["4ml Calcium Chloride", "1ml Magnesium Chloride", "1ml Vita Complex", "1ml Hydroxocobalamin B12"]
        }]
    },
    {
        name: "Quench",
        icon: "💧",
        sizes: [{
            size: "One Size",
            ingredients: ["3ml / 1,500mg Ascorbic Acid C", "3ml Vita Complex", "3ml Mineral Blend"]
        }]
    },
    {
        name: "Energize",
        icon: "⚡",
        sizes: [{
            size: "One Size",
            ingredients: ["3ml Vita Complex", "3ml Amino Blend"]
        }]
    },
    {
        name: "Beautify",
        icon: "✨",
        sizes: [{
            size: "One Size",
            ingredients: ["4ml / 2,000mg Ascorbic Acid C", "3ml Vita Complex", "1ml / 0.5mg Biotin"]
        }]
    },
    {
        name: "Immunize",
        icon: "🛡️",
        sizes: [{
            size: "One Size",
            ingredients: ["5ml / 2,500mg Ascorbic Acid C", "2ml Vita Complex", "1ml / 0.5mg Zinc Chloride"]
        }]
    },
    {
        name: "Tri Blend Immunize",
        icon: "🛡️",
        sizes: [{
            size: "One Size",
            ingredients: ["4ml / 800mg Glutathione", "15ml / 7,500mg Ascorbic Acid", "2ml / 1mg Zinc Chloride"]
        }]
    },
    {
        name: "Myer's Cocktail",
        icon: "🍸",
        sizes: [
            { size: "Medium", ingredients: ["5ml Myer's Cocktail"] },
            { size: "Large", ingredients: ["10ml Myer's Cocktail"] },
        ]
    },
    {
        name: "Mineralize (Mineral Blend)",
        icon: "🪨",
        sizes: [{
            size: "One Size",
            ingredients: ["5ml Mineral Blend"]
        }]
    },
    {
        name: "Replenish (B Vita Blend)",
        icon: "🔋",
        sizes: [{
            size: "One Size",
            ingredients: ["5ml B Vita Complex"]
        }]
    },
    {
        name: "Recover & Perform",
        icon: "🏃",
        sizes: [{
            size: "One Size",
            ingredients: ["3ml / 1,500mg Ascorbic Acid C", "3ml B Vita Complex", "3ml Amino Blend", "3ml Mineral Blend"]
        }]
    },
    {
        name: "Rebuild (Amino Blend)",
        icon: "💪",
        sizes: [{
            size: "One Size",
            ingredients: ["5ml Amino Blend"]
        }]
    },
    {
        name: "Flush",
        icon: "🧹",
        sizes: [{
            size: "One Size",
            ingredients: ["2ml B Vita Complex", "4ml / 800mg Glutathione"]
        }]
    },
    {
        name: "Burn — Weight Loss",
        icon: "🔥",
        sizes: [{
            size: "One Size",
            ingredients: ["3ml / 1,500mg Ascorbic Acid C", "3ml B Vita Complex", "3ml Amino Blend", "3ml Mineral Blend", "IM Injection — 1ml MIC Injection (IN MUSCLE ONLY)"],
        }]
    },
    {
        name: "Glutathione",
        icon: "🧬",
        sizes: [
            { size: "Medium", ingredients: ["5ml / 1,000mg Glutathione"] },
            { size: "Large", ingredients: ["7ml / 1,400mg Glutathione"] },
        ]
    },
    {
        name: "High C",
        icon: "🍊",
        sizes: [
            { size: "Medium", ingredients: ["15ml / 7,500mg Ascorbic Acid C"] },
            { size: "Large", ingredients: ["30ml / 15,000mg Ascorbic Acid C"] },
        ]
    },
    {
        name: "Libido",
        icon: "❤️‍🔥",
        sizes: [{
            size: "One Size",
            ingredients: ["5ml Myer's Cocktail", "1ml / 50mg L-Taurine", "1ml / 200mg Glutathione"]
        }]
    },
];

// ─── WELLNESS SHOT FORMULAS ───

const wellnessShots = [
    {
        name: "B Complete — 7 B Vitamins",
        icon: "💊",
        sizes: [
            { size: "Mid (1.5ml)", ingredients: ["0.5ml B12", "0.25ml / 0.125mg Biotin", "0.5ml Vita Complex"] },
            { size: "Max (3ml)", ingredients: ["1ml B12", "0.5ml / 0.25mg Biotin", "1ml Vita Complex"] },
        ]
    },
    {
        name: "Burn & Strengthen — L-Carnitine",
        icon: "🔥",
        sizes: [{
            size: "One Size",
            ingredients: ["1ml / 500mg L-Carnitine"]
        }]
    },
    {
        name: "Immune Defense — Vitamin C",
        icon: "🍊",
        sizes: [
            { size: "Mid", ingredients: ["1ml / 500mg Ascorbic Acid C"] },
            { size: "Max", ingredients: ["2ml / 1,000mg Ascorbic Acid C"] },
        ]
    },
    {
        name: "Anti-Aging & Immunity — Glutathione",
        icon: "🧬",
        sizes: [
            { size: "Mid", ingredients: ["1ml / 200mg Glutathione"] },
            { size: "Max", ingredients: ["2ml / 400mg Glutathione"] },
        ]
    },
    {
        name: "Hair Skin Nails — Biotin",
        icon: "💅",
        sizes: [{
            size: "One Size",
            ingredients: ["0.5ml / 0.25mg Biotin"]
        }]
    },
    {
        name: "Fat Burn Plus",
        icon: "🔥",
        sizes: [{
            size: "One Size",
            ingredients: ["1ml LipoStatPlus (Olympia formula)"]
        }]
    },
    {
        name: "Thyroid Support",
        icon: "🦋",
        sizes: [{
            size: "One Size (3ml)",
            ingredients: ["1ml B12", "1ml Amino Blend", "1ml Mineral Blend"]
        }]
    },
    {
        name: "Bone & Health — D3",
        icon: "🦴",
        note: "⚠️ See Dr. Bloy — lab test is required",
        sizes: [{
            size: "Standard",
            ingredients: ["1ml / 50,000mg D3"]
        }]
    },
    {
        name: "Elevate — B12",
        icon: "🚀",
        sizes: [{
            size: "One Size",
            ingredients: ["1ml B12"]
        }]
    },
    {
        name: "Myer's Mix",
        icon: "🍸",
        sizes: [{
            size: "One Size",
            ingredients: ["0.5ml B Vita Complex", "0.5ml B12", "0.5ml / 250mg Ascorbic Acid C", "0.5ml / 100mg Glutathione", "1ml Mineral Blend"]
        }]
    },
    {
        name: "Amino Boost",
        icon: "💪",
        sizes: [{
            size: "One Size",
            ingredients: ["1ml Amino Blend", "2ml / 400mg Glutathione"]
        }]
    },
];

// ─── NAD+ INJECTIONS ───

const nadInjections = [
    { dose: "20mg", amount: "0.2cc", cost: "$40" },
    { dose: "50mg", amount: "0.5cc", cost: "$100" },
    { dose: "100mg", amount: "1cc", cost: "$150" },
];

// ─── COMPONENTS ───

function DosingChart({ chart }) {
    const hasPrice = chart.rows.some(r => r.price);
    const hasSyringe = chart.rows.some(r => r.syringe);

    return (
        <Card className={`overflow-hidden border-2 ${chart.borderColor} shadow-lg hover:shadow-xl transition-shadow`}>
            <div className={`bg-gradient-to-r ${chart.color} p-5 text-white`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold">{chart.title}</h3>
                        <p className="text-white/80 text-sm mt-1">{chart.subtitle}</p>
                        {chart.updated && <p className="text-white/60 text-xs mt-1">{chart.updated}</p>}
                    </div>
                    <Pill className="w-10 h-10 text-white/40" />
                </div>
            </div>
            <CardContent className="p-0">
                <table className="w-full">
                    <thead>
                        <tr className={chart.headerBg}>
                            <th className={`text-left px-5 py-3 text-sm font-semibold ${chart.accentColor}`}>Milligrams</th>
                            <th className={`text-left px-5 py-3 text-sm font-semibold ${chart.accentColor}`}>Units</th>
                            {hasSyringe && <th className={`text-left px-5 py-3 text-sm font-semibold ${chart.accentColor}`}>Syringe</th>}
                            {hasPrice && <th className={`text-left px-5 py-3 text-sm font-semibold ${chart.accentColor}`}>Price</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {chart.rows.map((row, i) => (
                            <tr key={i} className={`border-t ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}>
                                <td className="px-5 py-3 font-semibold text-gray-900">{row.mg}</td>
                                <td className="px-5 py-3 text-gray-700"><Badge variant="outline" className="font-mono">{row.units}</Badge></td>
                                {hasSyringe && <td className="px-5 py-3 text-gray-600">{row.syringe}</td>}
                                {hasPrice && <td className="px-5 py-3"><span className="font-bold text-green-700">{row.price}</span></td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </CardContent>
        </Card>
    );
}

function HormoneDosingChart({ chart }) {
    return (
        <Card className={`overflow-hidden border-2 ${chart.borderColor} shadow-lg`}>
            <div className={`bg-gradient-to-r ${chart.color} p-5 text-white`}>
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-bold">{chart.title}</h3>
                        <p className="text-white/85 text-sm mt-1">{chart.subtitle}</p>
                    </div>
                    <Syringe className="w-10 h-10 text-white/45 shrink-0" />
                </div>
            </div>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px]">
                        <thead>
                            <tr className={chart.headerBg}>
                                <th className={`text-left px-5 py-3 text-sm font-semibold ${chart.accentColor}`}>Target Dose</th>
                                <th className={`text-left px-5 py-3 text-sm font-semibold ${chart.accentColor}`}>Vial Concentration</th>
                                <th className={`text-left px-5 py-3 text-sm font-semibold ${chart.accentColor}`}>Volume to Draw Up</th>
                                <th className={`text-left px-5 py-3 text-sm font-semibold ${chart.accentColor}`}>Syringe Units</th>
                            </tr>
                        </thead>
                        <tbody>
                            {chart.rows.map((row, i) => (
                                <tr key={row.dose} className={`border-t ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-emerald-50/60 transition-colors`}>
                                    <td className="px-5 py-3 font-semibold text-gray-900">{row.dose}</td>
                                    <td className="px-5 py-3 text-gray-700">{row.concentration}</td>
                                    <td className="px-5 py-3 text-gray-700">{row.volume}</td>
                                    <td className="px-5 py-3 text-gray-700">
                                        <Badge variant="outline" className="font-mono">{row.units}</Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {chart.notes?.length > 0 && (
                    <div className={`border-t ${chart.headerBg}/70 p-5`}>
                        <p className={`text-sm font-semibold ${chart.accentColor} mb-2`}>Clinical measuring notes</p>
                        <ul className="space-y-2">
                            {chart.notes.map((note) => (
                                <li key={note} className={`text-sm ${chart.accentColor}/85 flex gap-2`}>
                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-current shrink-0" />
                                    <span>{note}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function FormulaCard({ formula }) {
    return (
        <Card className="overflow-hidden border hover:shadow-lg transition-shadow">
            <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{formula.icon}</span>
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{formula.name}</h3>
                        {formula.note && (
                            <p className="text-xs text-red-600 font-medium mt-1">{formula.note}</p>
                        )}
                    </div>
                </div>
                <div className="space-y-3">
                    {formula.sizes.map((size, i) => (
                        <div key={i} className={`rounded-lg p-3 ${formula.sizes.length > 1 ? 'bg-gray-50 border' : 'bg-gray-50'}`}>
                            <Badge className={`mb-2 text-xs ${i === formula.sizes.length - 1 && formula.sizes.length > 1 ? 'bg-purple-600 text-white' : ''}`} variant={i === formula.sizes.length - 1 && formula.sizes.length > 1 ? "default" : "outline"}>
                                {size.size}
                            </Badge>
                            <ul className="space-y-1">
                                {size.ingredients.map((ing, j) => (
                                    <li key={j} className="text-sm text-gray-700 flex items-start gap-2">
                                        <span className="text-purple-400 mt-1">•</span>
                                        {ing}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
}

// ─── MAIN PAGE ───

export default function MedicationReference() {
    const [searchQuery, setSearchQuery] = useState("");

    const filterFormulas = (formulas) => {
        if (!searchQuery) return formulas;
        const q = searchQuery.toLowerCase();
        return formulas.filter(f =>
            f.name.toLowerCase().includes(q) ||
            f.sizes.some(s => s.ingredients.some(i => i.toLowerCase().includes(q)))
        );
    };

    const filteredIV = filterFormulas(ivFormulas);
    const filteredShots = filterFormulas(wellnessShots);
    const filteredGLP = searchQuery
        ? [semaglutideChart, tirzepatideChart].filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
        : [semaglutideChart, tirzepatideChart];
    const hormoneCharts = [testosteroneChart, estradiolChart];
    const filteredHormoneCharts = searchQuery
        ? hormoneCharts.filter(c =>
            c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.rows.some(r => Object.values(r).some(v => v.toLowerCase().includes(searchQuery.toLowerCase())))
        )
        : hormoneCharts;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Medication Reference</h1>
                    <p className="text-gray-600">Quick-reference dosing charts & formulas</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search medications or ingredients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 w-72"
                        />
                    </div>
                    <Button variant="outline" onClick={() => window.print()} className="gap-2">
                        <Printer className="w-4 h-4" />
                        Print
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="glp" className="space-y-4">
                <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 h-auto">
                    <TabsTrigger value="glp" className="text-base gap-2">
                        <Pill className="w-4 h-4" />
                        GLP Dosing
                    </TabsTrigger>
                    <TabsTrigger value="hormones" className="text-base gap-2">
                        <Syringe className="w-4 h-4" />
                        Hormone Dosing
                    </TabsTrigger>
                    <TabsTrigger value="iv" className="text-base gap-2">
                        <Droplets className="w-4 h-4" />
                        IV Infusions
                    </TabsTrigger>
                    <TabsTrigger value="shots" className="text-base gap-2">
                        <Zap className="w-4 h-4" />
                        Wellness Shots
                    </TabsTrigger>
                    <TabsTrigger value="nad" className="text-base gap-2">
                        <Sparkles className="w-4 h-4" />
                        NAD+
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="glp">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredGLP.map((chart, i) => <DosingChart key={i} chart={chart} />)}
                    </div>
                    {filteredGLP.length === 0 && <EmptyState />}
                </TabsContent>

                <TabsContent value="hormones">
                    <div className="grid grid-cols-1 gap-6 max-w-5xl">
                        {filteredHormoneCharts.map((chart) => <HormoneDosingChart key={chart.title} chart={chart} />)}
                    </div>
                    {filteredHormoneCharts.length === 0 && <EmptyState />}
                </TabsContent>

                <TabsContent value="iv">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredIV.map((formula, i) => <FormulaCard key={i} formula={formula} />)}
                    </div>
                    {filteredIV.length === 0 && <EmptyState />}
                </TabsContent>

                <TabsContent value="shots">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredShots.map((formula, i) => <FormulaCard key={i} formula={formula} />)}
                    </div>
                    {filteredShots.length === 0 && <EmptyState />}
                </TabsContent>

                <TabsContent value="nad">
                    <Card className="overflow-hidden border-2 border-purple-200 shadow-lg max-w-lg">
                        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-5 text-white">
                            <div className="flex items-center gap-3">
                                <Sparkles className="w-8 h-8 text-white/80" />
                                <div>
                                    <h3 className="text-xl font-bold">NAD+ Injections</h3>
                                    <p className="text-white/80 text-sm mt-1">Nicotinamide Adenine Dinucleotide</p>
                                </div>
                            </div>
                        </div>
                        <CardContent className="p-0">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-purple-50 border-b">
                                        <th className="text-left p-3 font-semibold text-purple-900">Dose</th>
                                        <th className="text-left p-3 font-semibold text-purple-900">Amount</th>
                                        <th className="text-left p-3 font-semibold text-purple-900">Cost</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {nadInjections.map((row, i) => (
                                        <tr key={i} className={`border-b last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-purple-50/50'}`}>
                                            <td className="p-3 font-medium text-gray-900">{row.dose}</td>
                                            <td className="p-3 text-gray-700">{row.amount}</td>
                                            <td className="p-3 font-semibold text-green-700">{row.cost}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="text-center py-12 text-gray-500">
            <Pill className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No medications match your search.</p>
        </div>
    );
}
