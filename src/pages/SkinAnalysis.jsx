import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ChevronRight, ChevronLeft, RotateCcw, AlertTriangle, Calendar, DollarSign, Clock, Star, Heart, Shield, Sun, Droplets, Check, Camera, Upload, Loader2, ClipboardList, FileText, Plus, Printer } from 'lucide-react';

// ─── PRINT STYLES ───
const PRINT_STYLES = `
@media print {
  body * { visibility: hidden !important; }
  #print-report, #print-report * { visibility: visible !important; }
  #print-report {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    padding: 20px !important;
    font-size: 12px !important;
  }
  #print-report h1 { font-size: 22px !important; }
  #print-report h2 { font-size: 16px !important; margin-top: 16px !important; }
  #print-report .print-section { page-break-inside: avoid; margin-bottom: 12px; }
  @page { margin: 0.5in; }
}
`;

// ─── DATA ───

const SKIN_TYPES = ['Normal', 'Dry', 'Oily', 'Combination', 'Sensitive'];

const CONCERNS = [
  'Acne/Breakouts', 'Fine Lines/Wrinkles', 'Hyperpigmentation/Dark Spots',
  'Uneven Skin Tone', 'Rosacea/Redness', 'Large Pores', 'Sun Damage',
  'Scarring (Acne/Surgical)', 'Sagging/Loss of Firmness', 'Dullness/Lack of Glow',
  'Melasma', 'Under-eye Circles/Hollows', 'Volume Loss',
  'Cellulite/Body Concerns', 'Excessive Sweating'
];

const AGE_RANGES = ['18-25', '26-35', '36-45', '46-55', '56+'];

const FITZPATRICK = [
  { type: 'I', desc: 'Very fair, always burns, never tans', color: '#FDEBD0' },
  { type: 'II', desc: 'Fair, burns easily, tans minimally', color: '#F5CBA7' },
  { type: 'III', desc: 'Medium, sometimes burns, tans gradually', color: '#E0B07B' },
  { type: 'IV', desc: 'Olive, rarely burns, tans easily', color: '#C49A6C' },
  { type: 'V', desc: 'Brown, very rarely burns, tans darkly', color: '#A0724A' },
  { type: 'VI', desc: 'Dark brown/black, never burns', color: '#6B4226' },
];

const PREV_TREATMENTS = ['Botox', 'Fillers', 'Chemical Peels', 'Laser', 'Microneedling', 'PRP', 'None'];

const BUDGETS = [
  { label: '$', desc: 'Basic — Peels & Facials', value: 1 },
  { label: '$$', desc: 'Mid-Range — Microneedling', value: 2 },
  { label: '$$$', desc: 'Premium — Injectables & Laser', value: 3 },
  { label: '$$$$', desc: 'Luxury — Combination Packages', value: 4 },
];

const ZONE_OPTIONS = ['Face', 'Neck', 'Décolleté', 'Hands'];

// CHC Device/Procedure Database
const PROCEDURES_DB = {
  'Chrome IPL': { cost: '$300–$600', sessions: '3-6 treatments, 4 wks apart', budget: 2, fitzRange: [1,2,3,4], desc: 'Intense Pulsed Light for global pigmentation, sun damage, and redness' },
  'Chrome Décolleté': { cost: '$300–$500', sessions: '3-6 treatments, 4 wks apart', budget: 2, fitzRange: [1,2,3,4], desc: 'IPL treatment designed for chest pigmentation and sun damage' },
  'Chrome Refresh': { cost: '$250–$500', sessions: '3-6 treatments, 4 wks apart', budget: 2, fitzRange: [1,2,3,4], desc: 'Light-based skin refreshing for tone and pigment correction' },
  'Chrome Natura Peel': { cost: '$150–$350', sessions: '3-6 treatments, 4 wks apart', budget: 1, fitzRange: [1,2,3,4,5,6], desc: 'Gentle laser peel for skin renewal — safe for all skin types' },
  'Chrome 532nm/1064nm Nano Frax QS': { cost: '$400–$900', sessions: '3-6 treatments, 4 wks apart', budget: 3, fitzRange: [1,2,3,4], desc: 'Fractional Q-Switched laser (8mm DF or 9mm HC) for pigmentation and texture' },
  'Chrome 1064nm Nano Frax QS': { cost: '$400–$900', sessions: '3-6 treatments, 4 wks apart', budget: 3, fitzRange: [1,2,3,4,5,6], desc: 'Fractional Q-Switched 1064nm laser — safe for darker skin types' },
  'Chrome Erbium 2940nm': { cost: '$500–$1,200', sessions: '3-6 treatments, 4 wks apart', budget: 3, fitzRange: [1,2,3,4], desc: 'Erbium laser (9mm microbeam) for pigmentation, texture, and resurfacing' },
  'Motus AZ+ Moveo Pigmented Lesions HP': { cost: '$350–$700', sessions: '3-6 treatments, 4 wks apart', budget: 2, fitzRange: [1,2,3,4], desc: 'Alexandrite-based Moveo handpiece for diffuse pigmented lesions' },
  'Motus AZ+ Moveo Skin Revitalization HP': { cost: '$300–$600', sessions: '3-6 treatments, 4 wks apart', budget: 2, fitzRange: [1,2,3,4,5,6], desc: 'Moveo handpiece for global skin revitalization — safe for all skin types' },
  'Tetra Cool Peel': { cost: '$300–$600', sessions: '3-6 treatments, 4 wks apart', budget: 2, fitzRange: [1,2,3,4,5,6], desc: 'CO2 Cool Peel for superficial resurfacing — safe for all skin types' },
  'Tetra Deka Peel': { cost: '$600–$1,500', sessions: '1-3 treatments, 6-8 wks apart', budget: 3, fitzRange: [1,2,3], desc: 'Aggressive CO2 resurfacing for deep lines and scarring (lighter skin types only)' },
  'Virtue RF Smart RF Microneedling': { cost: '$600–$1,200', sessions: '3-6 treatments, 4 wks apart', budget: 3, fitzRange: [1,2,3,4,5,6], desc: 'Radiofrequency microneedling for collagen remodeling and tightening' },
  'Virtue RF Deep RF': { cost: '$800–$1,500', sessions: '3 treatments, 4 wks apart', budget: 3, fitzRange: [1,2,3,4,5], desc: 'Deep radiofrequency for advanced tightening (neck: types IV-V only for darker skin)' },
  'Microneedling': { cost: '$200–$400', sessions: '3-6 treatments, 4 wks apart', budget: 2, fitzRange: [1,2,3,4,5,6], desc: 'Collagen induction therapy — safe for all skin types' },
  'Chrome 532nm QS Spot': { cost: '$200–$500', sessions: '1-3 spot treatments', budget: 2, fitzRange: [1,2,3,4], desc: 'Q-Switched 532nm for targeted pigment spot removal (3-5mm)' },
  'Chrome 1064nm QS Spot': { cost: '$200–$500', sessions: '1-3 spot treatments', budget: 2, fitzRange: [1,2,3,4,5,6], desc: 'Q-Switched 1064nm for targeted pigment — safe for darker skin' },
  'Motus AZ+ Alex 755nm Spot': { cost: '$250–$500', sessions: '1-3 spot treatments', budget: 2, fitzRange: [1,2,3,4], desc: 'Alexandrite 755nm (2.5 or 5mm) for targeted pigmented lesions' },
  'Chrome 1064nm P Laser Facial': { cost: '$300–$600', sessions: '3-6 treatments, 4 wks apart', budget: 2, fitzRange: [1,2,3,4,5,6], desc: '1064nm laser facial for pigment, vascularity, and skin health — all skin types' },
  'Chrome 532nm QS (Melasma)': { cost: '$300–$600', sessions: 'Series based on depth', budget: 2, fitzRange: [1,2,3], desc: 'Q-Switched 532nm for light epidermal melasma. Pretreat with melanin suppressant.' },
  'Chrome 1064nm QS (Melasma)': { cost: '$300–$600', sessions: 'Series based on depth', budget: 2, fitzRange: [1,2,3,4,5,6], desc: 'Q-Switched 1064nm for darker/dermal melasma — safe for all skin types. Pretreat with melanin suppressant.' },
  'Chrome Define': { cost: '$400–$800', sessions: '3-6 treatments, 4 wks apart', budget: 3, fitzRange: [1,2,3], desc: 'Laser skin defining treatment for tightening and revitalization' },
  'Subnovii': { cost: '$800–$2,000', sessions: '1 treatment, repeat at 4 months', budget: 3, fitzRange: [1,2,3,4], desc: 'Plasma pen for face/eyes/neck tightening. Pretreat ALL skin types with melanin suppressant.' },
  'Ultimate Duo (Virtue RF + Tetra)': { cost: '$900–$1,800', sessions: '3 treatments, 4 wks apart', budget: 4, fitzRange: [1,2,3,4], desc: 'Combination of Virtue RF Smart + Tetra Cool Peel for maximum texture and tightening results' },
  'Motus AZ+ Moveo Vascular Lesions HP': { cost: '$350–$700', sessions: '3-6 treatments, 4 wks apart', budget: 2, fitzRange: [1,2,3,4], desc: 'Moveo handpiece targeting vascular lesions, rosacea, and diffuse redness' },
  'Chrome 1064nm P Spot (Vascular)': { cost: '$200–$500', sessions: '1-3 spot treatments', budget: 2, fitzRange: [1,2,3,4], desc: 'Chrome 1064nm P (2-5mm) for telangiectasia, veins, and angiomas' },
  'Chrome Revivo': { cost: '$300–$600', sessions: '1-3 spot treatments', budget: 2, fitzRange: [1,2,3,4], desc: 'Targeted vascular laser for spider veins and small vessels' },
  'Motus AZ+ YAG 1064nm Spot': { cost: '$250–$500', sessions: '1-3 spot treatments', budget: 2, fitzRange: [1,2,3,4], desc: 'YAG 1064nm (2.5 or 5mm) for telangiectasia and angiomas' },
  'Motus AZ+ YAG 1064nm Laser Facial': { cost: '$300–$600', sessions: '6 treatments, 2 wks apart', budget: 2, fitzRange: [1,2,3,4,5,6], desc: 'YAG 1064nm Laser Facial (5mm) for active inflammatory/cystic acne' },
  'Virtue RF Exact RF': { cost: '$600–$1,200', sessions: '3 treatments, 4 wks apart', budget: 3, fitzRange: [1,2,3,4], desc: 'Precision RF for eye bags and festoons' },
  'Subnovii (Eyes)': { cost: '$500–$1,200', sessions: '1 treatment, repeat at 4 months', budget: 3, fitzRange: [1,2,3,4], desc: 'Plasma pen for upper/lower lids. Pretreat ALL skin types with melanin suppressant.' },
  'Physiq STEP/SDM/EMS': { cost: '$500–$1,500', sessions: '4-6 treatments', budget: 3, fitzRange: [1,2,3,4,5,6], desc: 'Body contouring with fat reduction (STEP/SDM) and muscle toning (EMS)' },
  'Physiq + Virtue Deep RF': { cost: '$1,000–$2,500', sessions: '4-6 treatments', budget: 4, fitzRange: [1,2,3,4,5], desc: 'Combined body contouring + deep RF tightening (Fitz I-V only)' },
  'Botox/Dysport': { cost: '$250–$600', sessions: '3-4x/year', budget: 3, fitzRange: [1,2,3,4,5,6], desc: 'Neuromodulator to relax muscles and smooth wrinkles' },
  'Dermal Fillers': { cost: '$500–$1,500/syringe', sessions: '1-2 sessions', budget: 3, fitzRange: [1,2,3,4,5,6], desc: 'Hyaluronic acid gel to restore volume and contour' },
  'Topical Rx (Melanin Suppressant)': { cost: '$50–$200', sessions: 'Ongoing', budget: 1, fitzRange: [1,2,3,4,5,6], desc: 'Prescription topicals (hydroquinone/tretinoin) for pigment management' },
  'Botox (Hyperhidrosis)': { cost: '$500–$1,000', sessions: '2x/year', budget: 3, fitzRange: [1,2,3,4,5,6], desc: 'Botox injections to reduce excessive sweating' },
};

const CONCERN_MAP_CHC = {
  'Hyperpigmentation/Dark Spots': {
    lightSkin: ['Chrome IPL', 'Chrome Décolleté', 'Chrome Refresh', 'Chrome Natura Peel', 'Chrome 532nm/1064nm Nano Frax QS', 'Chrome Erbium 2940nm', 'Motus AZ+ Moveo Pigmented Lesions HP', 'Tetra Cool Peel', 'Virtue RF Smart RF Microneedling', 'Chrome 532nm QS Spot', 'Motus AZ+ Alex 755nm Spot'],
    darkSkin: ['Chrome 1064nm P Laser Facial', 'Chrome Natura Peel', 'Chrome 1064nm Nano Frax QS', 'Motus AZ+ Moveo Skin Revitalization HP', 'Tetra Cool Peel', 'Virtue RF Smart RF Microneedling', 'Chrome 1064nm QS Spot'],
    notes: '3-6 treatments, 4 weeks apart. Pretreat darker skin with melanin suppressant min 2 weeks prior.',
    darkWarning: 'DO NOT recommend benign pigment spot treatments for darker skin types (Fitz IV-VI). Only global treatments are appropriate.',
  },
  'Sun Damage': {
    lightSkin: ['Chrome IPL', 'Chrome Décolleté', 'Chrome Refresh', 'Chrome 532nm/1064nm Nano Frax QS', 'Chrome Erbium 2940nm', 'Motus AZ+ Moveo Pigmented Lesions HP', 'Tetra Cool Peel'],
    darkSkin: ['Chrome 1064nm P Laser Facial', 'Chrome Natura Peel', 'Chrome 1064nm Nano Frax QS', 'Motus AZ+ Moveo Skin Revitalization HP', 'Tetra Cool Peel'],
    notes: '3-6 treatments, 4 weeks apart.',
  },
  'Uneven Skin Tone': {
    lightSkin: ['Chrome IPL', 'Chrome Refresh', 'Chrome Natura Peel', 'Motus AZ+ Moveo Pigmented Lesions HP', 'Chrome 532nm/1064nm Nano Frax QS', 'Tetra Cool Peel'],
    darkSkin: ['Chrome 1064nm P Laser Facial', 'Chrome Natura Peel', 'Chrome 1064nm Nano Frax QS', 'Motus AZ+ Moveo Skin Revitalization HP', 'Tetra Cool Peel'],
    notes: '3-6 treatments, 4 weeks apart.',
  },
  'Melasma': {
    lightSkin: ['Chrome 532nm QS (Melasma)', 'Chrome 1064nm QS (Melasma)', 'Topical Rx (Melanin Suppressant)'],
    darkSkin: ['Chrome 1064nm QS (Melasma)', 'Topical Rx (Melanin Suppressant)'],
    notes: 'Series based on wavelength/depth. MUST pretreat with melanin suppressant.',
    darkWarning: 'Fitzpatrick IV-VI: Only Chrome 1064nm QS is safe. Do NOT use 532nm on darker skin.',
  },
  'Fine Lines/Wrinkles': {
    lightSkin: ['Chrome 1064nm Nano Frax QS', 'Chrome Define', 'Chrome Erbium 2940nm', 'Virtue RF Smart RF Microneedling', 'Virtue RF Deep RF', 'Microneedling', 'Tetra Deka Peel', 'Tetra Cool Peel', 'Subnovii', 'Ultimate Duo (Virtue RF + Tetra)', 'Botox/Dysport'],
    darkSkin: ['Chrome 1064nm Nano Frax QS', 'Virtue RF Smart RF Microneedling', 'Tetra Cool Peel', 'Botox/Dysport'],
    notes: '3-6 treatments, 4 weeks apart. Subnovii 4 months apart.',
    darkWarning: 'Fitzpatrick IV-VI: BE VERY CAUTIOUS with resurfacing. Test spot + pretreat with melanin suppressant 2-4 weeks.',
  },
  'Scarring (Acne/Surgical)': {
    lightSkin: ['Chrome 1064nm Nano Frax QS', 'Chrome Define', 'Chrome Erbium 2940nm', 'Virtue RF Smart RF Microneedling', 'Virtue RF Deep RF', 'Microneedling', 'Tetra Deka Peel', 'Tetra Cool Peel', 'Subnovii', 'Ultimate Duo (Virtue RF + Tetra)'],
    darkSkin: ['Chrome 1064nm Nano Frax QS', 'Virtue RF Smart RF Microneedling', 'Tetra Cool Peel'],
    notes: '3-6 treatments, 4 weeks apart.',
    darkWarning: 'Fitzpatrick IV-VI: BE VERY CAUTIOUS. Test spot + pretreat with melanin suppressant 2-4 weeks.',
  },
  'Sagging/Loss of Firmness': {
    lightSkin: ['Chrome 1064nm P Laser Facial', 'Chrome Natura Peel', 'Chrome 1064nm Nano Frax QS', 'Chrome Define', 'Chrome Erbium 2940nm', 'Motus AZ+ Moveo Skin Revitalization HP', 'Virtue RF Smart RF Microneedling', 'Virtue RF Deep RF', 'Microneedling', 'Tetra Deka Peel', 'Tetra Cool Peel', 'Subnovii'],
    darkSkin: ['Chrome 1064nm P Laser Facial', 'Chrome Natura Peel', 'Chrome 1064nm Nano Frax QS', 'Motus AZ+ Moveo Skin Revitalization HP', 'Virtue RF Smart RF Microneedling', 'Virtue RF Deep RF', 'Microneedling', 'Tetra Cool Peel'],
    notes: '3-6 treatments, 4 weeks apart. Subnovii 4 months apart.',
    darkWarning: 'Fitzpatrick IV-VI: Deep RF for neck only (types IV-V). No Subnovii, Chrome Define, or Erbium.',
  },
  'Dullness/Lack of Glow': {
    lightSkin: ['Chrome Natura Peel', 'Chrome Refresh', 'Chrome IPL', 'Motus AZ+ Moveo Skin Revitalization HP', 'Tetra Cool Peel', 'Microneedling'],
    darkSkin: ['Chrome Natura Peel', 'Chrome 1064nm P Laser Facial', 'Motus AZ+ Moveo Skin Revitalization HP', 'Tetra Cool Peel', 'Microneedling'],
    notes: '3-6 treatments, 4 weeks apart.',
  },
  'Rosacea/Redness': {
    lightSkin: ['Chrome IPL', 'Motus AZ+ Moveo Vascular Lesions HP', 'Chrome 1064nm P Spot (Vascular)', 'Chrome Revivo', 'Motus AZ+ YAG 1064nm Spot'],
    darkSkin: ['Chrome 1064nm P Laser Facial', 'Motus AZ+ Moveo Skin Revitalization HP'],
    notes: '3-6 treatments, 4 weeks apart.',
    darkWarning: 'Fitzpatrick IV-VI: DO NOT recommend vascular spot treatments for darker skin types.',
  },
  'Acne/Breakouts': {
    lightSkin: ['Chrome IPL', 'Chrome 1064nm P Laser Facial', 'Chrome Natura Peel', 'Motus AZ+ Moveo Skin Revitalization HP', 'Motus AZ+ YAG 1064nm Laser Facial'],
    darkSkin: ['Chrome 1064nm P Laser Facial', 'Chrome Natura Peel', 'Motus AZ+ Moveo Skin Revitalization HP', 'Motus AZ+ YAG 1064nm Laser Facial'],
    notes: '6 treatments, 2 weeks apart.',
  },
  'Large Pores': {
    lightSkin: ['Chrome 1064nm Nano Frax QS', 'Chrome Erbium 2940nm', 'Virtue RF Smart RF Microneedling', 'Tetra Cool Peel', 'Microneedling'],
    darkSkin: ['Chrome 1064nm Nano Frax QS', 'Virtue RF Smart RF Microneedling', 'Tetra Cool Peel', 'Microneedling'],
    notes: '3-6 treatments, 4 weeks apart.',
  },
  'Under-eye Circles/Hollows': {
    lightSkin: ['Virtue RF Exact RF', 'Subnovii (Eyes)', 'Dermal Fillers'],
    darkSkin: ['Dermal Fillers'],
    notes: 'Subnovii 4 months apart. ALL skin types pretreat with melanin suppressant.',
    darkWarning: 'Fitzpatrick IV-VI: Eye laser/plasma treatments require extreme caution. Dermal fillers are safest.',
  },
  'Volume Loss': {
    allSkin: ['Dermal Fillers'],
    notes: '1-2 sessions as needed.',
  },
  'Cellulite/Body Concerns': {
    allSkin: ['Physiq STEP/SDM/EMS'],
    lightSkin: ['Physiq + Virtue Deep RF'],
    darkSkin: [],
    notes: 'Physiq + Virtue Deep RF for Fitzpatrick I-V only.',
  },
  'Excessive Sweating': {
    allSkin: ['Botox (Hyperhidrosis)'],
    notes: '2x per year maintenance.',
  },
};

const CONCERN_MAP = Object.fromEntries(
  Object.entries(CONCERN_MAP_CHC).map(([concern, data]) => {
    const all = [...new Set([...(data.allSkin || []), ...(data.lightSkin || []), ...(data.darkSkin || [])])];
    return [concern, all];
  })
);

const PRODUCTS = {
  'Acne/Breakouts': [
    { name: 'SkinCeuticals Blemish & Age Defense', price: '$115', desc: 'Targets acne + aging combo with salicylic, glycolic & dioic acid' },
    { name: 'Obagi Clenziderm Therapeutic Lotion', price: '$95', desc: 'BPO acne treatment lotion' },
    { name: 'Obagi Clenziderm Daily Foaming Cleanser', price: '$49', desc: 'Medicated cleanser for acne-prone skin' },
    { name: 'Noon Benzoazelin Forte', price: '$118', desc: 'Professional-grade acne treatment' },
    { name: 'SkinCeuticals Clarifying Clay Mask', price: '$66', desc: 'Purifying mask for oily, acne-prone skin' },
    { name: 'Noon Acno Complex Ampoule', price: '$58', desc: 'Targeted acne treatment ampoule' },
  ],
  'Fine Lines/Wrinkles': [
    { name: 'SkinCeuticals CE Ferulic', price: '$185', desc: 'Gold-standard antioxidant serum for aging & sun damage' },
    { name: 'SkinCeuticals A.G.E Interrupter Ultra', price: '$185', desc: 'Targets deep wrinkles and advanced aging signs' },
    { name: 'Obagi Tretinoin 0.05%', price: '$95', desc: 'Rx retinoid for collagen stimulation & cell turnover' },
    { name: 'Noon Restart Serum', price: '$158', desc: 'Skin renewal and anti-aging serum' },
    { name: 'Elemis Pro-Collagen Marine Cream SPF 30', price: '$140', desc: 'Hydrating anti-aging moisturizer with SPF' },
    { name: 'SkinCeuticals HA Intensifier', price: '$110', desc: 'Hyaluronic acid booster for hydration & fine lines' },
  ],
  'Hyperpigmentation/Dark Spots': [
    { name: 'SkinCeuticals Discoloration Defense', price: '$115', desc: 'Targets dark spots, melasma & uneven tone' },
    { name: 'Obagi Nu-Derm Blender', price: '$135', desc: 'Prescription-strength pigment correction' },
    { name: 'SkinCeuticals Phyto A+ Brightening Treatment', price: '$115', desc: 'Brightening treatment for hyperpigmentation' },
    { name: 'Noon Double White', price: '$158', desc: 'Professional brightening for hyperpigmentation' },
    { name: 'Obagi Professional C 20%', price: '$150', desc: 'High-potency vitamin C for brightening' },
    { name: 'SkinCeuticals Daily Brightening UV Defense', price: '$65', desc: 'SPF with brightening — prevents further darkening' },
  ],
  'Uneven Skin Tone': [
    { name: 'SkinCeuticals Discoloration Defense', price: '$115', desc: 'Corrects uneven tone and discoloration' },
    { name: 'SkinCeuticals Phyto A+ Brightening Treatment', price: '$115', desc: 'Brightens and evens skin tone' },
    { name: 'Obagi Professional C 15%', price: '$125', desc: 'Vitamin C antioxidant for tone correction' },
    { name: 'Noon Vita C Serum', price: '$119', desc: 'Brightening antioxidant serum' },
    { name: 'Elemis Super-C Serum', price: '$145', desc: 'Brightening antioxidant serum' },
  ],
  'Melasma': [
    { name: 'SkinCeuticals Discoloration Defense', price: '$115', desc: 'Non-hydroquinone melasma correction' },
    { name: 'Obagi Nu-Derm Blender', price: '$135', desc: 'Prescription-strength melanin suppression for melasma' },
    { name: 'Obagi Nu-Derm Clear', price: '$135', desc: 'Hydroquinone-based pigment corrector' },
    { name: 'Noon Double White', price: '$158', desc: 'Professional-grade brightening for melasma' },
    { name: 'SkinCeuticals Physical Fusion SPF', price: '$45', desc: 'Mineral SPF — essential for melasma management' },
  ],
  'Dullness/Lack of Glow': [
    { name: 'SkinCeuticals CE Ferulic', price: '$185', desc: 'Antioxidant serum for radiant, glowing skin' },
    { name: 'SkinCeuticals Glycolic 10', price: '$96', desc: 'Gentle exfoliation for texture and radiance' },
    { name: 'SkinCeuticals Cell Cycle Catalyst', price: '$120', desc: 'Skin renewal for dull, tired skin' },
    { name: 'Noon Vita C Serum', price: '$119', desc: 'Brightening antioxidant for glow' },
    { name: 'Elemis Dynamic Resurfacing Peel & Reset', price: '$118', desc: 'Exfoliation for renewed radiance' },
  ],
  'Rosacea/Redness': [
    { name: 'SkinCeuticals Phyto Corrective Gel', price: '$85', desc: 'Botanical gel to calm redness & sensitivity' },
    { name: 'SkinCeuticals Phyto Corrective Mask', price: '$66', desc: 'Calming mask for redness and irritation' },
    { name: 'SkinCeuticals Phyto Corrective Mist', price: '$70', desc: 'On-the-go redness relief mist' },
    { name: 'Noon SOS Cream', price: '$108', desc: 'Calming cream for irritated, red skin' },
    { name: 'SkinCeuticals Soothing Cleanser', price: '$39', desc: 'Gentle cleanser for sensitive, redness-prone skin' },
  ],
  'Large Pores': [
    { name: 'SkinCeuticals Glycolic 10', price: '$96', desc: 'Exfoliating treatment to minimize pore appearance' },
    { name: 'SkinCeuticals LHA Toner', price: '$44', desc: 'Pore-refining toner with LHA' },
    { name: 'Obagi Clenziderm Pore Therapy', price: '$49', desc: 'BHA pore treatment' },
    { name: 'SkinCeuticals Simply Clean', price: '$39', desc: 'Oil-controlling cleanser for oily/combo skin' },
  ],
  'Sagging/Loss of Firmness': [
    { name: 'Obagi Elastiderm Facial Serum', price: '$215', desc: 'Anti-aging serum for firmness and elasticity' },
    { name: 'Obagi Elastiderm Lift & Sculpt', price: '$135', desc: 'Lifting treatment for sagging skin' },
    { name: 'SkinCeuticals Triple Lipid', price: '$155', desc: 'Barrier repair and anti-aging moisturizer' },
    { name: 'Elemis Future Restore Serum', price: '$155', desc: 'Anti-aging serum for firmness' },
    { name: 'Noon Restart Serum', price: '$158', desc: 'Skin renewal and firming serum' },
  ],
  'Sun Damage': [
    { name: 'SkinCeuticals CE Ferulic', price: '$185', desc: 'Antioxidant protection & repair for sun damage' },
    { name: 'SkinCeuticals Phloretin CF', price: '$185', desc: 'Antioxidant for oily/combo sun-damaged skin' },
    { name: 'SkinCeuticals Physical Fusion SPF', price: '$45', desc: 'Daily mineral sunscreen protection' },
    { name: 'Obagi Professional C 20%', price: '$150', desc: 'Vitamin C for sun damage repair' },
  ],
  'Under-eye Circles/Hollows': [
    { name: 'Obagi Elastiderm Eye Serum', price: '$125', desc: 'Anti-aging eye serum for under-eye concerns' },
    { name: 'Noon Reform Eye Cream', price: '$139', desc: 'Eye area anti-aging cream' },
    { name: 'Elemis Pro-Collagen Vitality Eye Cream', price: '$115', desc: 'Eye anti-aging and hydration' },
    { name: 'Obagi Hydro-Drops Eyes', price: '$75', desc: 'Hydrating eye treatment' },
  ],
  'Scarring (Acne/Surgical)': [
    { name: 'Obagi Tretinoin 0.05%', price: '$95', desc: 'Promotes cell turnover for scar improvement' },
    { name: 'SkinCeuticals Epidermal Repair', price: '$90', desc: 'Post-procedure healing support' },
    { name: 'Noon Retinol 1.0', price: '$109', desc: 'Retinoid for texture and scar improvement' },
    { name: 'SkinCeuticals Glycolic 10', price: '$96', desc: 'Exfoliation to improve scar texture' },
  ],
  'Volume Loss': [
    { name: 'SkinCeuticals HA Intensifier', price: '$110', desc: 'Hyaluronic acid booster for plumping' },
    { name: 'Noon In-Depth Filler Cream', price: '$108', desc: 'Topical plumping for fine lines' },
    { name: 'Noon Halo-Ronic Serum', price: '$118', desc: 'Hydration and plumping serum' },
  ],
  'Cellulite/Body Concerns': [
    { name: 'SkinCeuticals Body Tightening Concentrate', price: '$90', desc: 'Body firming treatment' },
  ],
  'Excessive Sweating': [
    { name: 'SkinCeuticals Physical Fusion SPF', price: '$45', desc: 'Lightweight mineral SPF for sensitive/sweaty skin' },
  ],
  default: [
    { name: 'SkinCeuticals Physical Fusion SPF', price: '$45', desc: 'Daily mineral sunscreen — the #1 anti-aging product' },
    { name: 'SkinCeuticals HA Intensifier', price: '$110', desc: 'Hyaluronic acid hydration booster' },
    { name: 'SkinCeuticals Soothing Cleanser', price: '$39', desc: 'Gentle daily cleanser for all skin types' },
  ],
};

// ─── SKIN HEALTH SCORE ───

function calculateSkinHealthScore(answers) {
  let score = 100;
  // Concern severity (we don't have severity in questionnaire, so -8 per concern as average)
  score -= (answers.concerns?.length || 0) * 8;
  // Age adjustment
  const ageMap = { '18-25': 5, '26-35': 0, '36-45': -5, '46-55': -10, '56+': -15 };
  score += (ageMap[answers.ageRange] || 0);
  // Fitzpatrick I-II with sun damage
  if (['I', 'II'].includes(answers.fitzpatrick) && answers.concerns?.includes('Sun Damage')) {
    score -= 5;
  }
  // Previous treatments bonus
  const prevCount = (answers.prevTreatments || []).filter(t => t !== 'None').length;
  score += prevCount * 2;
  return Math.max(20, Math.min(100, Math.round(score)));
}

function getScoreInfo(score) {
  if (score >= 80) return { label: 'Excellent', color: '#22c55e', bg: 'bg-green-50', text: 'text-green-700' };
  if (score >= 60) return { label: 'Good', color: '#84cc16', bg: 'bg-lime-50', text: 'text-lime-700' };
  if (score >= 40) return { label: 'Fair', color: '#f97316', bg: 'bg-orange-50', text: 'text-orange-700' };
  return { label: 'Needs Attention', color: '#ef4444', bg: 'bg-red-50', text: 'text-red-700' };
}

function SkinHealthScoreRing({ score, size = 140 }) {
  const info = getScoreInfo(score);
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={info.color} strokeWidth="10"
          strokeDasharray={circumference} strokeDashoffset={circumference - progress}
          strokeLinecap="round" className="transition-all duration-1000" />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-3xl font-bold text-gray-900">{score}</span>
        <span className={`text-xs font-semibold ${info.text}`}>{info.label}</span>
      </div>
    </div>
  );
}

// ─── COST PARSING HELPER ───

function parseCostRange(costStr) {
  const nums = costStr?.match(/[\d,]+/g)?.map(n => parseInt(n.replace(/,/g, ''))) || [];
  return { low: nums[0] || 0, high: nums[1] || nums[0] || 0 };
}

// ─── TREATMENT PLAN BUILDER ───

function TreatmentPlanBuilder({ procedures, products, answers, skinHealthScore }) {
  const [showPlan, setShowPlan] = useState(false);

  if (!showPlan) {
    return (
      <div className="text-center">
        <Button onClick={() => setShowPlan(true)} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white gap-2 h-12 text-base">
          <Calendar className="w-5 h-5" /> Build Treatment Plan
        </Button>
      </div>
    );
  }

  // Build phases from procedures
  const phase1Procs = procedures.slice(0, 2);
  const phase2Procs = procedures.slice(2, 5);
  const phase3Procs = procedures.slice(5, 8);
  const phase1Products = products.slice(0, 3);

  const calcPhaseCost = (procs) => {
    let low = 0, high = 0;
    procs.forEach(p => { const c = parseCostRange(p.cost); low += c.low; high += c.high; });
    return { low, high };
  };

  const p1Cost = calcPhaseCost(phase1Procs);
  const p2Cost = calcPhaseCost(phase2Procs);
  const p3Cost = calcPhaseCost(phase3Procs);
  // Add product costs to phase 1
  phase1Products.forEach(p => { const c = parseCostRange(p.price); p1Cost.low += c.low; p1Cost.high += c.high; });

  const totalLow = p1Cost.low + p2Cost.low + p3Cost.low;
  const totalHigh = p1Cost.high + p2Cost.high + p3Cost.high;
  const totalVisits = phase1Procs.length * 2 + phase2Procs.length * 3 + phase3Procs.length * 2 + 2;

  const phases = [
    {
      name: 'Phase 1: Foundation', duration: 'Weeks 1–4', icon: '🌱',
      desc: 'Initial treatments and skincare routine establishment',
      procs: phase1Procs, products: phase1Products, cost: p1Cost,
    },
    {
      name: 'Phase 2: Targeted', duration: 'Weeks 5–12', icon: '🎯',
      desc: 'Core procedure series addressing primary concerns',
      procs: phase2Procs, products: [], cost: p2Cost,
    },
    {
      name: 'Phase 3: Optimization', duration: 'Months 4–6', icon: '✨',
      desc: 'Follow-up treatments, maintenance, and result optimization',
      procs: phase3Procs, products: [], cost: p3Cost,
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-green-500" /> Your Treatment Plan
      </h2>
      {phases.map((phase, i) => (
        <Card key={i} className="bg-white/80 backdrop-blur border-green-100 shadow">
          <CardContent className="pt-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xl flex-shrink-0">{phase.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-gray-900">{phase.name}</h3>
                  <Badge variant="outline" className="text-xs">{phase.duration}</Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1">{phase.desc}</p>
                {phase.procs.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Procedures</p>
                    {phase.procs.map(p => (
                      <div key={p.name} className="flex items-center justify-between text-sm bg-green-50 rounded-lg px-3 py-2">
                        <span className="font-medium text-gray-800">{p.name}</span>
                        <span className="text-gray-500 text-xs">{p.cost}</span>
                      </div>
                    ))}
                  </div>
                )}
                {phase.products.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Skincare Products</p>
                    {phase.products.map(p => (
                      <div key={p.name} className="flex items-center justify-between text-sm bg-cyan-50 rounded-lg px-3 py-2">
                        <span className="font-medium text-gray-800">{p.name}</span>
                        <span className="text-gray-500 text-xs">{p.price}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-2 text-right text-sm font-semibold text-green-700">
                  Phase Cost: ${phase.cost.low.toLocaleString()}–${phase.cost.high.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Summary */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg">
        <CardContent className="pt-6">
          <h3 className="font-bold text-gray-900 mb-4 text-lg">Plan Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">{totalVisits}</p>
              <p className="text-xs text-gray-500">Total Visits</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">6 mo</p>
              <p className="text-xs text-gray-500">Timeline</p>
            </div>
            <div>
              <p className="text-lg font-bold text-green-600">${totalLow.toLocaleString()}–${totalHigh.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Est. Total</p>
            </div>
          </div>
          <div className="mt-4 text-center">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-500 text-white gap-2" onClick={() => window.location.hash = '#/CheckoutQuote'}>
              <Heart className="w-4 h-4" /> Book a Consultation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── PRINT REPORT ───

function PrintReport({ answers, results, procedures, products, phases, skinHealthScore, photoResults, zones }) {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const isPhoto = !!photoResults;
  const displayResults = photoResults || results;
  const displayConcerns = isPhoto ? (displayResults?.concerns || []) : (answers?.concerns || []);
  const displayProcs = isPhoto ? (displayResults?.recommendations || []) : (procedures || []);
  const displayProducts = isPhoto ? (displayResults?.productRecommendations || []) : (products || []);

  return (
    <div id="print-report" className="hidden print:block p-8 bg-white text-black max-w-[800px] mx-auto">
      <div className="print-section border-b-2 border-purple-600 pb-4 mb-4">
        <h1 className="text-2xl font-bold text-purple-800">Contemporary Health Center</h1>
        <p className="text-lg text-gray-600">Skin Analysis Report</p>
        <p className="text-sm text-gray-400">Generated: {date}</p>
      </div>

      <div className="print-section mb-4">
        <h2 className="text-lg font-bold mb-2">Skin Profile</h2>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div><strong>Skin Type:</strong> {isPhoto ? displayResults?.skinType : answers?.skinType}</div>
          <div><strong>Fitzpatrick:</strong> Type {isPhoto ? displayResults?.fitzpatrickEstimate : answers?.fitzpatrick}</div>
          {!isPhoto && <div><strong>Age Range:</strong> {answers?.ageRange}</div>}
        </div>
        {skinHealthScore && (
          <div className="mt-2"><strong>Skin Health Score:</strong> {skinHealthScore}/100 — {getScoreInfo(skinHealthScore).label}</div>
        )}
      </div>

      {isPhoto && displayResults?.overallAssessment && (
        <div className="print-section mb-4">
          <h2 className="text-lg font-bold mb-2">Overall Assessment</h2>
          <p className="text-sm">{displayResults.overallAssessment}</p>
        </div>
      )}

      <div className="print-section mb-4">
        <h2 className="text-lg font-bold mb-2">Concerns</h2>
        <ul className="text-sm space-y-1">
          {displayConcerns.map((c, i) => (
            <li key={i}>• {typeof c === 'string' ? c : `${c.name} (${c.severity}) — ${c.description}`}</li>
          ))}
        </ul>
      </div>

      <div className="print-section mb-4">
        <h2 className="text-lg font-bold mb-2">Recommended Procedures</h2>
        <ul className="text-sm space-y-1">
          {displayProcs.map((p, i) => (
            <li key={i}>• <strong>{p.name || p.procedure}</strong> — {p.desc || p.reason} {p.cost && `(${p.cost})`}</li>
          ))}
        </ul>
      </div>

      <div className="print-section mb-4">
        <h2 className="text-lg font-bold mb-2">Recommended Products</h2>
        <ul className="text-sm space-y-1">
          {displayProducts.map((p, i) => (
            <li key={i}>• <strong>{p.name}</strong> {p.price && `(${p.price})`} — {p.desc || p.reason}</li>
          ))}
        </ul>
      </div>

      {zones && zones.length > 1 && (
        <div className="print-section mb-4">
          <h2 className="text-lg font-bold mb-2">Multi-Zone Analysis</h2>
          {zones.map((z, i) => (
            <div key={i} className="mb-2">
              <h3 className="font-semibold">{z.zone}</h3>
              <p className="text-sm">{z.results?.overallAssessment}</p>
            </div>
          ))}
        </div>
      )}

      <div className="print-section border-t border-gray-300 pt-4 mt-6 text-xs text-gray-500">
        <p className="italic mb-2">This analysis is for informational purposes only and does not constitute a medical diagnosis. Individual results may vary. Always consult with a licensed provider before starting any treatment.</p>
        <p className="font-semibold">Schedule your consultation at contemporaryhealthcenter.com</p>
      </div>
    </div>
  );
}

// ─── LOGIC ───

function getRecommendations(answers) {
  const { concerns, budget, fitzpatrick } = answers;
  const fitzNum = ['I','II','III','IV','V','VI'].indexOf(fitzpatrick) + 1;
  const isLightSkin = fitzNum <= 3;
  const isDarkSkin = fitzNum >= 4;

  const procScores = {};
  const clinicalNotes = [];
  const darkWarnings = [];

  concerns.forEach(c => {
    const mapping = CONCERN_MAP_CHC[c];
    if (!mapping) return;
    let procs = [];
    if (mapping.allSkin) procs.push(...mapping.allSkin);
    if (isLightSkin && mapping.lightSkin) procs.push(...mapping.lightSkin);
    if (isDarkSkin && mapping.darkSkin) procs.push(...mapping.darkSkin);
    procs = [...new Set(procs)];
    procs = procs.filter(p => {
      const db = PROCEDURES_DB[p];
      return db && db.fitzRange && db.fitzRange.includes(fitzNum);
    });
    procs.forEach((p, i) => {
      if (!procScores[p]) procScores[p] = { count: 0, reasons: [] };
      procScores[p].count += (procs.length - i);
      if (!procScores[p].reasons.includes(c)) procScores[p].reasons.push(c);
    });
    if (mapping.notes && !clinicalNotes.includes(mapping.notes)) clinicalNotes.push(mapping.notes);
    if (isDarkSkin && mapping.darkWarning && !darkWarnings.includes(mapping.darkWarning)) darkWarnings.push(mapping.darkWarning);
  });

  let procedures = Object.entries(procScores)
    .map(([name, data]) => ({ name, ...PROCEDURES_DB[name], reasons: data.reasons, score: data.count }))
    .filter(p => p.budget <= budget)
    .sort((a, b) => b.score - a.score);

  const warnings = [];
  if (isDarkSkin) {
    darkWarnings.forEach(msg => { warnings.push({ type: 'fitzpatrick', message: msg, affected: [] }); });
    if (darkWarnings.length === 0) {
      warnings.push({ type: 'fitzpatrick', message: `With Fitzpatrick Type ${fitzpatrick}, some treatments require extra caution. All recommended procedures below have been filtered for your skin type safety.`, affected: [] });
    }
  }
  clinicalNotes.forEach(note => { warnings.push({ type: 'clinical', message: note, affected: [] }); });

  const productSet = new Map();
  concerns.forEach(c => { (PRODUCTS[c] || PRODUCTS.default).forEach(p => productSet.set(p.name, p)); });
  if (productSet.size === 0) PRODUCTS.default.forEach(p => productSet.set(p.name, p));
  productSet.set('Broad Spectrum SPF 50', { name: 'Broad Spectrum SPF 50', desc: 'Daily sunscreen — essential for all treatment plans' });
  if (isDarkSkin && concerns.some(c => ['Hyperpigmentation/Dark Spots', 'Melasma', 'Sun Damage', 'Uneven Skin Tone'].includes(c))) {
    productSet.set('Melanin Suppressant', { name: 'Melanin Suppressant (Rx)', desc: 'Pre-treatment required min 2 weeks prior to laser procedures for darker skin types' });
  }

  const phases = buildPlan(procedures, answers);
  return { procedures: procedures.slice(0, 8), products: [...productSet.values()].slice(0, 6), warnings, phases };
}

function buildPlan(procedures, answers) {
  const phase1 = [], phase2 = [], phase3 = [];
  procedures.forEach((p, i) => {
    if (i < 2) phase1.push(p.name);
    else if (i < 5) phase2.push(p.name);
    else phase3.push(p.name);
  });
  return [
    { name: 'Phase 1: Foundation', duration: 'Weeks 1-4', items: phase1.length ? phase1 : ['Skincare routine optimization', 'SPF daily'], desc: 'Build your base with gentle treatments and skincare' },
    { name: 'Phase 2: Targeted Treatment', duration: 'Months 2-4', items: phase2.length ? phase2 : ['Continue Phase 1 treatments'], desc: 'Address specific concerns with targeted procedures' },
    { name: 'Phase 3: Maintenance', duration: 'Ongoing', items: phase3.length ? phase3 : ['Periodic touch-ups', 'Medical-grade skincare'], desc: 'Maintain results with scheduled follow-ups' },
  ];
}

// ─── COMPONENTS ───

function StepIndicator({ current, total }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
            i < current ? 'bg-purple-600 text-white' : i === current ? 'bg-purple-500 text-white ring-4 ring-purple-200' : 'bg-gray-200 text-gray-500'
          }`}>{i + 1}</div>
          {i < total - 1 && <div className={`w-8 h-0.5 ${i < current ? 'bg-purple-500' : 'bg-gray-200'}`} />}
        </div>
      ))}
    </div>
  );
}

function OptionCard({ selected, onClick, children, className = '' }) {
  return (
    <button onClick={onClick} className={`p-4 rounded-xl border-2 text-left transition-all ${
      selected ? 'border-purple-500 bg-purple-50 shadow-md' : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'
    } ${className}`}>{children}</button>
  );
}

function MultiSelect({ options, selected, onToggle }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {options.map(opt => (
        <OptionCard key={opt} selected={selected.includes(opt)} onClick={() => onToggle(opt)}>
          <div className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
              selected.includes(opt) ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
            }`}>{selected.includes(opt) && <Check className="w-3 h-3 text-white" />}</div>
            <span className="font-medium text-gray-800">{opt}</span>
          </div>
        </OptionCard>
      ))}
    </div>
  );
}

// ─── PHOTO ANALYSIS ───

function compressImage(file, maxSize = 1024) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function ImageCropper({ imageSrc, onCrop, onCancel }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const [crop, setCrop] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  const [imgDims, setImgDims] = useState(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !crop) return;
    const ctx = canvas.getContext('2d');
    canvas.width = img.width; canvas.height = img.height;
    ctx.drawImage(img, 0, 0, img.width, img.height);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.clearRect(crop.x, crop.y, crop.w, crop.h);
    ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, crop.x, crop.y, crop.w, crop.h);
    ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 2;
    ctx.strokeRect(crop.x, crop.y, crop.w, crop.h);
    const hs = 10; ctx.fillStyle = '#a855f7';
    [[crop.x, crop.y], [crop.x + crop.w, crop.y], [crop.x, crop.y + crop.h], [crop.x + crop.w, crop.y + crop.h]].forEach(([cx, cy]) => {
      ctx.fillRect(cx - hs/2, cy - hs/2, hs, hs);
    });
  }, [crop]);

  useEffect(() => { draw(); }, [draw]);

  const onImgLoad = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const w = img.width, h = img.height;
    setImgDims({ w, h });
    const cw = Math.round(w * 0.8), ch = Math.round(h * 0.8);
    setCrop({ x: Math.round((w - cw) / 2), y: Math.round((h - ch) / 2), w: cw, h: ch });
  }, []);

  useEffect(() => {
    const img = new Image();
    img.onload = () => { imgRef.current = img; onImgLoad(); };
    img.src = imageSrc;
  }, [imageSrc, onImgLoad]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
    return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
  };

  const getHandle = (pos) => {
    if (!crop) return null;
    const ht = 20;
    const corners = { nw: [crop.x, crop.y], ne: [crop.x + crop.w, crop.y], sw: [crop.x, crop.y + crop.h], se: [crop.x + crop.w, crop.y + crop.h] };
    for (const [key, [cx, cy]] of Object.entries(corners)) {
      if (Math.abs(pos.x - cx) < ht && Math.abs(pos.y - cy) < ht) return key;
    }
    if (pos.x > crop.x && pos.x < crop.x + crop.w && pos.y > crop.y && pos.y < crop.y + crop.h) return 'move';
    return null;
  };

  const onStart = (e) => { e.preventDefault(); const pos = getPos(e); const handle = getHandle(pos); if (handle) { setDragging(handle); setDragStart({ ...pos, crop: { ...crop } }); } };
  const onMove = (e) => {
    if (!dragging || !dragStart || !imgDims) return;
    e.preventDefault();
    const pos = getPos(e);
    const dx = pos.x - dragStart.x, dy = pos.y - dragStart.y;
    const oc = dragStart.crop; const minSize = 50;
    if (dragging === 'move') {
      let nx = oc.x + dx, ny = oc.y + dy;
      nx = Math.max(0, Math.min(imgDims.w - oc.w, nx));
      ny = Math.max(0, Math.min(imgDims.h - oc.h, ny));
      setCrop({ ...oc, x: nx, y: ny });
    } else {
      let { x, y, w, h } = oc;
      if (dragging.includes('w')) { x = oc.x + dx; w = oc.w - dx; }
      if (dragging.includes('e')) { w = oc.w + dx; }
      if (dragging.includes('n')) { y = oc.y + dy; h = oc.h - dy; }
      if (dragging.includes('s')) { h = oc.h + dy; }
      if (w < minSize) { w = minSize; if (dragging.includes('w')) x = oc.x + oc.w - minSize; }
      if (h < minSize) { h = minSize; if (dragging.includes('n')) y = oc.y + oc.h - minSize; }
      x = Math.max(0, x); y = Math.max(0, y);
      if (x + w > imgDims.w) w = imgDims.w - x;
      if (y + h > imgDims.h) h = imgDims.h - y;
      setCrop({ x, y, w, h });
    }
  };
  const onEnd = () => { setDragging(null); setDragStart(null); };

  const doCrop = () => {
    if (!crop || !imgRef.current) return;
    const c = document.createElement('canvas');
    c.width = crop.w; c.height = crop.h;
    c.getContext('2d').drawImage(imgRef.current, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
    onCrop(c.toDataURL('image/jpeg', 0.9));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 text-center">Drag to move, pull corners to resize the crop area</p>
      <div ref={containerRef} className="flex justify-center">
        <canvas ref={canvasRef} className="rounded-xl max-h-[400px] w-full object-contain touch-none"
          style={{ maxWidth: '100%', cursor: dragging === 'move' ? 'grabbing' : 'crosshair' }}
          onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onEnd}
          onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd} />
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={onCancel} variant="outline" className="gap-2"><RotateCcw className="w-4 h-4" /> Retake</Button>
        <Button onClick={doCrop} className="bg-purple-600 hover:bg-purple-700 text-white gap-2"><Check className="w-4 h-4" /> Crop & Continue</Button>
      </div>
    </div>
  );
}

function PhotoAnalysis() {
  const [rawImage, setRawImage] = useState(null);
  const [image, setImage] = useState(null);
  const [phase, setPhase] = useState('upload');
  const [analyzing, setAnalyzing] = useState(false);
  const [zones, setZones] = useState([]); // Array of { zone: string, results: object, image: string }
  const [activeZoneTab, setActiveZoneTab] = useState(0);
  const [selectingZone, setSelectingZone] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [showTreatmentPlan, setShowTreatmentPlan] = useState(false);
  const fileRef = useRef();
  const cameraRef = useRef();

  const currentResults = zones[activeZoneTab]?.results;
  const hasResults = zones.length > 0;

  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) { setError('Please select a valid image file.'); return; }
    setError('');
    const dataUrl = await compressImage(file);
    setRawImage(dataUrl);
    setPhase('crop');
  }, []);

  const handleCropped = (croppedDataUrl) => { setImage(croppedDataUrl); setPhase('preview'); };

  const analyze = async (zoneName = 'Face') => {
    if (!image) return;
    setAnalyzing(true); setError('');
    try {
      const base64 = image.split(',')[1];
      const mimeMatch = image.match(/data:(image\/\w+);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const resp = await fetch('/api/skin-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Analysis failed');
      const newZone = { zone: zoneName, results: data.analysis, image };
      setZones(prev => [...prev, newZone]);
      setActiveZoneTab(zones.length);
      setPhase('results');
      setSelectingZone(false);
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const startNewZone = () => { setSelectingZone(true); };

  const selectZone = (zoneName) => {
    setSelectingZone(false);
    setRawImage(null); setImage(null); setPhase('upload');
    // Store the pending zone name
    window.__pendingZone = zoneName;
  };

  const reset = () => {
    setRawImage(null); setImage(null); setPhase('upload');
    setZones([]); setActiveZoneTab(0); setError(''); setSelectingZone(false); setShowTreatmentPlan(false);
  };

  const severityColor = (s) => {
    const l = s?.toLowerCase();
    if (l === 'mild') return 'bg-green-100 text-green-700 border-green-200';
    if (l === 'moderate') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  const priorityColor = (p) => {
    const l = p?.toLowerCase();
    if (l === 'high') return 'bg-red-50 text-red-600';
    if (l === 'medium') return 'bg-yellow-50 text-yellow-600';
    return 'bg-green-50 text-green-600';
  };

  // Merge all zones' recommendations (deduped)
  const getCombinedRecommendations = () => {
    if (zones.length <= 1) return null;
    const procMap = new Map();
    const prodMap = new Map();
    zones.forEach(z => {
      z.results?.recommendations?.forEach(r => { if (!procMap.has(r.procedure)) procMap.set(r.procedure, r); });
      z.results?.productRecommendations?.forEach(p => { if (!prodMap.has(p.name)) prodMap.set(p.name, p); });
    });
    return { procedures: [...procMap.values()], products: [...prodMap.values()] };
  };

  // Get all procedures across zones for treatment plan
  const getAllProceduresForPlan = () => {
    const procMap = new Map();
    zones.forEach(z => {
      z.results?.recommendations?.forEach(r => {
        if (!procMap.has(r.procedure)) {
          const dbEntry = PROCEDURES_DB[r.procedure] || {};
          procMap.set(r.procedure, { name: r.procedure, cost: dbEntry.cost || 'N/A', ...dbEntry, reasons: [r.reason] });
        }
      });
    });
    return [...procMap.values()];
  };

  const getAllProductsForPlan = () => {
    const prodMap = new Map();
    zones.forEach(z => {
      z.results?.productRecommendations?.forEach(p => {
        if (!prodMap.has(p.name)) prodMap.set(p.name, p);
      });
    });
    return [...prodMap.values()];
  };

  const avgScore = zones.length > 0
    ? Math.round(zones.reduce((sum, z) => sum + (z.results?.skinHealthScore || 65), 0) / zones.length)
    : null;

  if (hasResults && phase === 'results') {
    const combined = getCombinedRecommendations();
    const usedZoneNames = zones.map(z => z.zone);
    const availableZones = ZONE_OPTIONS.filter(z => !usedZoneNames.includes(z));

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Print report (hidden) */}
        <PrintReport photoResults={currentResults} answers={{}} procedures={[]} products={[]}
          phases={[]} skinHealthScore={avgScore} zones={zones} />

        {/* Zone selector if selecting */}
        {selectingZone && (
          <Card className="bg-white/80 backdrop-blur border-purple-100 shadow-lg">
            <CardContent className="pt-6">
              <h3 className="font-bold text-gray-900 mb-3">Select Zone to Analyze</h3>
              <div className="grid grid-cols-2 gap-3">
                {availableZones.map(z => (
                  <Button key={z} variant="outline" onClick={() => selectZone(z)} className="h-12">{z}</Button>
                ))}
              </div>
              <Button variant="ghost" onClick={() => setSelectingZone(false)} className="mt-3 w-full">Cancel</Button>
            </CardContent>
          </Card>
        )}

        {/* Skin Health Score */}
        {avgScore && (
          <Card className="bg-white/80 backdrop-blur border-purple-100 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center relative">
                <h2 className="font-bold text-lg text-gray-900 mb-3">Skin Health Score</h2>
                <SkinHealthScoreRing score={avgScore} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Zone Tabs */}
        {zones.length > 1 && (
          <div className="flex gap-2 bg-gray-100 p-1 rounded-xl overflow-x-auto">
            {zones.map((z, i) => (
              <button key={i} onClick={() => setActiveZoneTab(i)}
                className={`flex-shrink-0 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
                  activeZoneTab === i ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>{z.zone}</button>
            ))}
            {zones.length > 1 && (
              <button onClick={() => setActiveZoneTab(-1)}
                className={`flex-shrink-0 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
                  activeZoneTab === -1 ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>Combined</button>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <Card className="bg-amber-50 border-amber-200 shadow">
          <CardContent className="pt-5 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-amber-800 text-sm font-medium">⚠️ This AI analysis is for informational purposes only and does not constitute a medical diagnosis.</p>
          </CardContent>
        </Card>

        {activeZoneTab === -1 && combined ? (
          /* Combined view */
          <>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2"><Star className="w-5 h-5 text-purple-500" /> Combined Recommended Procedures</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {combined.procedures.map((r, i) => (
                  <Card key={i} className="bg-white/80 backdrop-blur border-purple-100 shadow hover:shadow-lg transition-shadow">
                    <CardContent className="pt-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-900">{r.procedure}</h3>
                        <Badge className={priorityColor(r.priority)}>{r.priority}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{r.reason}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2"><Droplets className="w-5 h-5 text-cyan-500" /> Combined Product Recommendations</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {combined.products.map((p, i) => (
                  <Card key={i} className="bg-white/80 backdrop-blur border-cyan-100 shadow">
                    <CardContent className="pt-5 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-gray-900 text-sm">{p.name}</h3>
                        {p.price && <span className="text-sm font-semibold text-purple-600 whitespace-nowrap">{p.price}</span>}
                      </div>
                      <p className="text-xs text-gray-500">{p.brand}</p>
                      <p className="text-sm text-gray-600">{p.reason}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        ) : currentResults && (
          /* Individual zone view */
          <>
            <Card className="bg-white/80 backdrop-blur border-purple-100 shadow-lg">
              <CardContent className="pt-6">
                <h2 className="font-bold text-lg text-gray-900 mb-2 flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-500" /> Overall Assessment {zones.length > 1 && `— ${zones[activeZoneTab]?.zone}`}</h2>
                <p className="text-gray-700 mb-4">{currentResults.overallAssessment}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500 block">Skin Type</span><span className="font-semibold">{currentResults.skinType}</span></div>
                  <div><span className="text-gray-500 block">Fitzpatrick Estimate</span><span className="font-semibold">Type {currentResults.fitzpatrickEstimate}</span></div>
                </div>
              </CardContent>
            </Card>

            {currentResults.concerns?.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-orange-500" /> Detected Concerns</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentResults.concerns.map((c, i) => (
                    <Card key={i} className="bg-white/80 backdrop-blur border-purple-100 shadow hover:shadow-lg transition-shadow">
                      <CardContent className="pt-5 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-gray-900">{c.name}</h3>
                          <Badge className={severityColor(c.severity)}>{c.severity}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{c.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {currentResults.recommendations?.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2"><Star className="w-5 h-5 text-purple-500" /> Recommended Procedures</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentResults.recommendations.map((r, i) => (
                    <Card key={i} className="bg-white/80 backdrop-blur border-purple-100 shadow hover:shadow-lg transition-shadow">
                      <CardContent className="pt-5 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-gray-900">{r.procedure}</h3>
                          <Badge className={priorityColor(r.priority)}>{r.priority}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{r.reason}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {currentResults.productRecommendations?.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2"><Droplets className="w-5 h-5 text-cyan-500" /> Recommended CHC Products</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentResults.productRecommendations.map((p, i) => (
                    <Card key={i} className="bg-white/80 backdrop-blur border-cyan-100 shadow">
                      <CardContent className="pt-5 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-gray-900 text-sm">{p.name}</h3>
                          {p.price && <span className="text-sm font-semibold text-purple-600 whitespace-nowrap">{p.price}</span>}
                        </div>
                        <p className="text-xs text-gray-500">{p.brand}</p>
                        <p className="text-sm text-gray-600">{p.reason}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {currentResults.skincare?.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2"><Droplets className="w-5 h-5 text-cyan-500" /> Skincare Tips</h2>
                <Card className="bg-white/80 backdrop-blur border-cyan-100 shadow">
                  <CardContent className="pt-5">
                    <ul className="space-y-2">
                      {currentResults.skincare.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />{s}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}

            {currentResults.notes && (
              <Card className="bg-purple-50 border-purple-100 shadow">
                <CardContent className="pt-5">
                  <p className="text-sm text-purple-800"><strong>Additional Notes:</strong> {currentResults.notes}</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Treatment Plan Builder */}
        <TreatmentPlanBuilder
          procedures={getAllProceduresForPlan()}
          products={getAllProductsForPlan()}
          answers={{}}
          skinHealthScore={avgScore}
        />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4 flex-wrap">
          <Button onClick={reset} variant="outline" className="gap-2"><RotateCcw className="w-4 h-4" /> Try Again</Button>
          {availableZones.length > 0 && zones.length < 4 && (
            <Button onClick={startNewZone} variant="outline" className="gap-2 border-purple-300 text-purple-700">
              <Plus className="w-4 h-4" /> Analyze Another Zone
            </Button>
          )}
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <FileText className="w-4 h-4" /> 📄 Download Report
          </Button>
          <Button className="bg-gradient-to-r from-purple-600 to-pink-500 text-white gap-2" onClick={() => window.location.hash = '#/CheckoutQuote'}>
            <Heart className="w-4 h-4" /> Book a Consultation
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="bg-white/80 backdrop-blur border-purple-100 shadow-lg">
        <CardContent className="pt-6">
          {phase === 'upload' && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
              className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${dragOver ? 'border-purple-500 bg-purple-50' : 'border-gray-300'}`}
            >
              <Camera className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <p className="text-gray-700 font-medium mb-1">
                {zones.length > 0 ? `Upload photo for ${window.__pendingZone || 'new zone'}` : 'Take or upload a photo of your skin'}
              </p>
              <p className="text-gray-400 text-sm mb-6">For best results, use good lighting and a close-up of the area of concern</p>
              <div className="flex flex-col gap-3 justify-center max-w-xs mx-auto">
                <Button onClick={() => cameraRef.current?.click()} className="bg-purple-600 hover:bg-purple-700 text-white gap-2 h-14 text-base">
                  <Camera className="w-5 h-5" /> 📷 Take Photo
                </Button>
                <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-2 h-14 text-base border-2">
                  <Upload className="w-5 h-5" /> 📁 Upload Photo
                </Button>
              </div>
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { handleFile(e.target.files[0]); e.target.value = ''; }} />
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { handleFile(e.target.files[0]); e.target.value = ''; }} />
            </div>
          )}
          {phase === 'crop' && rawImage && (
            <ImageCropper imageSrc={rawImage} onCrop={handleCropped} onCancel={() => { setRawImage(null); setPhase(zones.length > 0 ? 'results' : 'upload'); }} />
          )}
          {phase === 'preview' && image && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 text-center">Cropped preview — ready for analysis</p>
              <img src={image} alt="Cropped skin photo" className="rounded-xl max-h-80 mx-auto object-contain" />
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => { setRawImage(null); setImage(null); setPhase(zones.length > 0 ? 'results' : 'upload'); }} variant="outline" className="gap-2"><RotateCcw className="w-4 h-4" /> Retake</Button>
                <Button onClick={() => analyze(window.__pendingZone || 'Face')} disabled={analyzing} className="bg-gradient-to-r from-purple-600 to-pink-500 text-white gap-2 h-12 text-base">
                  {analyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Sparkles className="w-4 h-4" /> Analyze My Skin</>}
                </Button>
              </div>
            </div>
          )}
          {analyzing && (
            <div className="text-center mt-4">
              <p className="text-purple-600 text-sm font-medium animate-pulse">AI is analyzing your skin...</p>
            </div>
          )}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── MAIN COMPONENT ───

export default function SkinAnalysis() {
  const [mode, setMode] = useState('photo');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    skinType: '', concerns: [], ageRange: '', fitzpatrick: '', prevTreatments: [], budget: 0,
  });
  const [results, setResults] = useState(null);

  // Inject print styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = PRINT_STYLES;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const STEPS = ['Skin Type', 'Concerns', 'Age Range', 'Fitzpatrick', 'Previous Treatments', 'Budget'];

  const canNext = () => {
    switch (step) {
      case 0: return !!answers.skinType;
      case 1: return answers.concerns.length > 0;
      case 2: return !!answers.ageRange;
      case 3: return !!answers.fitzpatrick;
      case 4: return true;
      case 5: return answers.budget > 0;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
    else setResults(getRecommendations(answers));
  };

  const toggleConcern = (c) => {
    setAnswers(a => ({ ...a, concerns: a.concerns.includes(c) ? a.concerns.filter(x => x !== c) : [...a.concerns, c] }));
  };

  const togglePrev = (t) => {
    setAnswers(a => {
      if (t === 'None') return { ...a, prevTreatments: ['None'] };
      const without = a.prevTreatments.filter(x => x !== 'None');
      return { ...a, prevTreatments: without.includes(t) ? without.filter(x => x !== t) : [...without, t] };
    });
  };

  const reset = () => {
    setStep(0);
    setAnswers({ skinType: '', concerns: [], ageRange: '', fitzpatrick: '', prevTreatments: [], budget: 0 });
    setResults(null);
  };

  if (results) return <ResultsView results={results} answers={answers} onReset={reset} />;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-3">
          <Sparkles className="w-4 h-4" /> Skin Analysis Tool
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Personalized Skin Assessment</h1>
        <p className="text-gray-500 mt-1">Choose how you'd like to analyze your skin</p>
      </div>

      <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl max-w-md mx-auto">
        <button onClick={() => setMode('photo')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${mode === 'photo' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <Camera className="w-4 h-4" /> Photo Analysis
        </button>
        <button onClick={() => setMode('quiz')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${mode === 'quiz' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <ClipboardList className="w-4 h-4" /> Questionnaire
        </button>
      </div>

      {mode === 'photo' ? <PhotoAnalysis /> : <></>}
      {mode !== 'photo' && <>
        <StepIndicator current={step} total={6} />
        <Card className="bg-white/80 backdrop-blur border-purple-100 shadow-lg">
          <CardHeader><CardTitle className="text-lg text-purple-800">{STEPS[step]}</CardTitle></CardHeader>
          <CardContent>
            {step === 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SKIN_TYPES.map(t => (
                  <OptionCard key={t} selected={answers.skinType === t} onClick={() => setAnswers(a => ({ ...a, skinType: t }))}>
                    <span className="font-semibold text-gray-800">{t}</span>
                  </OptionCard>
                ))}
              </div>
            )}
            {step === 1 && (
              <><p className="text-sm text-gray-500 mb-3">Select all that apply</p>
              <MultiSelect options={CONCERNS} selected={answers.concerns} onToggle={toggleConcern} /></>
            )}
            {step === 2 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {AGE_RANGES.map(a => (
                  <OptionCard key={a} selected={answers.ageRange === a} onClick={() => setAnswers(ans => ({ ...ans, ageRange: a }))}>
                    <span className="font-semibold text-gray-800">{a}</span>
                  </OptionCard>
                ))}
              </div>
            )}
            {step === 3 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FITZPATRICK.map(f => (
                  <OptionCard key={f.type} selected={answers.fitzpatrick === f.type} onClick={() => setAnswers(a => ({ ...a, fitzpatrick: f.type }))}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border-2 border-gray-200 flex-shrink-0" style={{ backgroundColor: f.color }} />
                      <div>
                        <div className="font-bold text-gray-800">Type {f.type}</div>
                        <div className="text-xs text-gray-500">{f.desc}</div>
                      </div>
                    </div>
                  </OptionCard>
                ))}
              </div>
            )}
            {step === 4 && (
              <><p className="text-sm text-gray-500 mb-3">Optional — select any you've had before</p>
              <MultiSelect options={PREV_TREATMENTS} selected={answers.prevTreatments} onToggle={togglePrev} /></>
            )}
            {step === 5 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BUDGETS.map(b => (
                  <OptionCard key={b.value} selected={answers.budget === b.value} onClick={() => setAnswers(a => ({ ...a, budget: b.value }))}>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{b.label}</div>
                      <div className="text-sm text-gray-500">{b.desc}</div>
                    </div>
                  </OptionCard>
                ))}
              </div>
            )}
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button onClick={handleNext} disabled={!canNext()} className="bg-purple-600 hover:bg-purple-700 text-white">
                {step === 5 ? 'See My Results' : 'Next'} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </>}
    </div>
  );
}

function ResultsView({ results, answers, onReset }) {
  const { procedures, products, warnings, phases } = results;
  const skinHealthScore = calculateSkinHealthScore(answers);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Print report (hidden) */}
      <PrintReport answers={answers} results={results} procedures={procedures} products={products}
        phases={phases} skinHealthScore={skinHealthScore} />

      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-3">
          <Sparkles className="w-4 h-4" /> Your Results
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Your Personalized Skin Profile</h1>
      </div>

      {/* Skin Health Score */}
      <Card className="bg-white/80 backdrop-blur border-purple-100 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center relative">
            <h2 className="font-bold text-lg text-gray-900 mb-3">Skin Health Score</h2>
            <SkinHealthScoreRing score={skinHealthScore} />
          </div>
        </CardContent>
      </Card>

      {/* Profile Summary */}
      <Card className="bg-white/80 backdrop-blur border-purple-100 shadow-lg">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div><span className="text-gray-500 block">Skin Type</span><span className="font-semibold">{answers.skinType}</span></div>
            <div><span className="text-gray-500 block">Age Range</span><span className="font-semibold">{answers.ageRange}</span></div>
            <div><span className="text-gray-500 block">Fitzpatrick</span><span className="font-semibold">Type {answers.fitzpatrick}</span></div>
          </div>
          <div className="mt-3">
            <span className="text-gray-500 text-sm block mb-1">Concerns</span>
            <div className="flex flex-wrap gap-2">
              {answers.concerns.map(c => (
                <Badge key={c} variant="secondary" className="bg-purple-100 text-purple-700">{c}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warnings */}
      {warnings.map((w, i) => (
        <Card key={i} className={w.type === 'clinical' ? 'bg-blue-50 border-blue-200 shadow' : 'bg-amber-50 border-amber-200 shadow'}>
          <CardContent className="pt-6 flex gap-3">
            {w.type === 'clinical'
              ? <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              : <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            }
            <div>
              <p className={`font-medium text-sm ${w.type === 'clinical' ? 'text-blue-800' : 'text-amber-800'}`}>
                {w.type === 'clinical' ? '📋 Treatment Protocol: ' : '⚠️ '}{w.message}
              </p>
              {w.affected.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {w.affected.map(a => <Badge key={a} variant="outline" className="border-amber-300 text-amber-700 text-xs">{a}</Badge>)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Recommended Procedures */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2"><Star className="w-5 h-5 text-purple-500" /> Recommended Procedures</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {procedures.map(p => (
            <Card key={p.name} className="bg-white/80 backdrop-blur border-purple-100 shadow hover:shadow-lg transition-shadow">
              <CardContent className="pt-5 space-y-2">
                <h3 className="font-bold text-gray-900">{p.name}</h3>
                <p className="text-sm text-gray-600">{p.desc}</p>
                <div className="flex flex-wrap gap-1">
                  {p.reasons.map(r => <Badge key={r} className="bg-purple-50 text-purple-600 text-xs">{r}</Badge>)}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{p.cost}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{p.sessions}</span>
                </div>
                {(['IV','V','VI'].includes(answers.fitzpatrick)) && (
                  <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                    <Shield className="w-3 h-3" /> Verified safe for Fitzpatrick Type {answers.fitzpatrick}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Products */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2"><Droplets className="w-5 h-5 text-cyan-500" /> Recommended Skincare</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {products.map(p => (
            <Card key={p.name} className="bg-white/80 backdrop-blur border-cyan-100 shadow">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-gray-800 text-sm">{p.name}</h3>
                  {p.price && <span className="text-xs font-semibold text-purple-600 whitespace-nowrap">{p.price}</span>}
                </div>
                <p className="text-xs text-gray-500 mt-1">{p.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Treatment Plan */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2"><Calendar className="w-5 h-5 text-green-500" /> Suggested Treatment Plan</h2>
        <div className="space-y-3">
          {phases.map((phase, i) => (
            <Card key={i} className="bg-white/80 backdrop-blur border-green-100 shadow">
              <CardContent className="pt-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold flex-shrink-0">{i + 1}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900">{phase.name}</h3>
                      <Badge variant="outline" className="text-xs">{phase.duration}</Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{phase.desc}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {phase.items.map(item => (
                        <Badge key={item} className="bg-green-50 text-green-700 text-xs">{item}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Treatment Plan Builder */}
      <TreatmentPlanBuilder procedures={procedures} products={products} answers={answers} skinHealthScore={skinHealthScore} />

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4 flex-wrap">
        <Button onClick={onReset} variant="outline" className="gap-2">
          <RotateCcw className="w-4 h-4" /> Start Over
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => window.print()}>
          <FileText className="w-4 h-4" /> 📄 Download Report
        </Button>
        <Button className="bg-gradient-to-r from-purple-600 to-pink-500 text-white gap-2" onClick={() => window.location.hash = '#/CheckoutQuote'}>
          <Heart className="w-4 h-4" /> Book a Consultation
        </Button>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 text-center pb-4">
        This tool provides general recommendations only and does not replace a professional consultation.
        Individual results vary. Always consult with your provider before starting any treatment.
      </p>
    </div>
  );
}
