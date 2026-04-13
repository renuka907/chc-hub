import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, FileText } from "lucide-react";

const CHC_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695939a556b8082002a35a68/1e5584b38_goldwithlettersContemporary-health-center-logo-retina.png";

const PRINT_STYLES = `
@media print {
  @page { size: letter; margin: 0.35in 0.5in; }
  * { box-sizing: border-box; }
  nav, header, aside, footer, .no-print, [class*="sidebar"], [class*="Sidebar"] { display: none !important; height: 0 !important; max-height: 0 !important; overflow: hidden !important; padding: 0 !important; margin: 0 !important; }
  html, body { margin: 0 !important; padding: 0 !important; height: auto !important; min-height: 0 !important; overflow: visible !important; background: white !important; }
  #root, #root > *, main, [class*="layout"], [class*="Layout"], [class*="container"], [class*="Container"] { all: unset !important; display: block !important; }
  .print-area { display: block !important; box-shadow: none !important; border: none !important; padding: 0 !important; margin: 0 auto !important; border-radius: 0 !important; max-width: 100% !important; background: white !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}
`;

function PrintHeader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid #5b21b6", paddingBottom: "10px", marginBottom: "16px" }}>
      <img src={CHC_LOGO} alt="CHC Logo" style={{ height: "52px" }} />
      <div style={{ textAlign: "right" }}>
        <div id="form-title" style={{ fontSize: "17pt", fontWeight: "700", color: "#5b21b6", fontFamily: "Arial, sans-serif" }}></div>
        <div style={{ fontSize: "9pt", color: "#6b7280", fontFamily: "Arial, sans-serif" }}>Contemporary Health Center | Fort Myers, FL</div>
      </div>
    </div>
  );
}

const FORMS = {
  waiver: {
    label: "Skin Test Waiver",
    title: "Bellafill\u00ae Skin Test Waiver",
    content: (
      <>
        <style>{PRINT_STYLES}</style>
        {/* Patient Info */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "4px 14px", marginBottom: "10px" }}>
          {["Patient Full Name", "Date of Birth", "Date", "Provider"].map(label => (
            <div key={label}>
              <div style={{ fontSize: "7pt", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: "2px", fontFamily: "Arial, sans-serif" }}>{label}</div>
              <div style={{ borderBottom: "1.5px solid #374151", minHeight: "18px" }}>&nbsp;</div>
            </div>
          ))}
        </div>
        {/* Body */}
        <div style={{ fontSize: "9.5pt", lineHeight: "1.45", marginBottom: "12px", fontFamily: "Arial, sans-serif" }}>
          <p style={{ marginBottom: "6px" }}>In many cases it may be appropriate to waive the skin test for Bellafill&reg; even though a 28 day test is recommended by the FDA and the manufacturer. We do not recommend that a patient waive the test if they have a history of multiple allergies or if they have had a past reaction to bovine products or lidocaine.</p>
          <p style={{ marginBottom: "6px" }}>The rationale for waiving of the skin test is as follows:</p>
          <p style={{ marginBottom: "6px" }}>Allergic reactions to Bellafill&reg; are rare (less than 1%). If symptoms do occur they are generally mild, of short duration, treatable, and not related to the long acting component of Bellafill.</p>
          <p style={{ marginBottom: "6px" }}>Even with a single negative skin test a future positive reaction may occur.</p>
          <p style={{ marginBottom: "6px" }}>By signing below you are indicating that you are waiving the skin test in order to be treated at this time.</p>
        </div>
        {/* Signatures */}
        {[["Patient Signature", "Date"], ["Witness Signature", "Date"]].map(([left, right], i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr", gap: "6px 16px", marginBottom: "10px", alignItems: "end" }}>
            <div>
              <div style={{ borderBottom: "1.5px solid #374151", minHeight: "22px", marginBottom: "2px" }}>&nbsp;</div>
              <div style={{ fontSize: "8pt", color: "#374151", fontWeight: "600", fontFamily: "Arial, sans-serif" }}>{left}</div>
            </div>
            <div>
              <div style={{ borderBottom: "1.5px solid #374151", minHeight: "22px", marginBottom: "2px" }}>&nbsp;</div>
              <div style={{ fontSize: "8pt", color: "#374151", fontWeight: "600", fontFamily: "Arial, sans-serif" }}>{right}</div>
            </div>
          </div>
        ))}
        {/* Footer */}
        <div style={{ marginTop: "12px", borderTop: "1px solid #e5e7eb", paddingTop: "4px", fontSize: "7pt", color: "#9ca3af", textAlign: "center", fontFamily: "Arial, sans-serif" }}>
          Contemporary Health Center &nbsp;|&nbsp; 6150 Diamond Center Court #400, Fort Myers, FL 33912 &nbsp;|&nbsp; Ph: 239-561-9191 &nbsp;|&nbsp; Fx: 239-561-9188
        </div>
      </>
    )
  },

  consent: {
    label: "Treatment Consent",
    title: "Bellafill\u00ae Informed Consent",
    content: (
      <>
        <style>{PRINT_STYLES}</style>
        {/* Patient Info */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px 16px", marginBottom: "14px" }}>
          {["Patient Full Name", "Date of Birth", "Date", "Provider"].map(label => (
            <div key={label}>
              <div style={{ fontSize: "7.5pt", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: "2px", fontFamily: "Arial, sans-serif" }}>{label}</div>
              <div style={{ borderBottom: "1.5px solid #374151", minHeight: "20px" }}>&nbsp;</div>
            </div>
          ))}
        </div>

        {/* What is Bellafill */}
        <div style={{ fontSize: "10pt", fontWeight: "700", color: "#5b21b6", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #ede9fe", paddingBottom: "3px", margin: "12px 0 7px", fontFamily: "Arial, sans-serif" }}>What is Bellafill?</div>
        <p style={{ marginBottom: "7px", fontSize: "10.5pt", fontFamily: "Arial, sans-serif" }}>Bellafill is an FDA-approved long-lasting dermal filler used to correct nasolabial folds and acne scars. It contains bovine collagen and polymethylmethacrylate (PMMA) microspheres in a lidocaine-containing gel. The collagen provides immediate volume while PMMA microspheres provide long-term structure as your own collagen grows around them.</p>

        {/* Treatment Area */}
        <div style={{ fontSize: "10pt", fontWeight: "700", color: "#5b21b6", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #ede9fe", paddingBottom: "3px", margin: "12px 0 7px", fontFamily: "Arial, sans-serif" }}>Treatment Area(s)</div>
        <div style={{ fontSize: "7.5pt", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: "3px", fontFamily: "Arial, sans-serif" }}>Planned treatment area(s)</div>
        <div style={{ borderBottom: "1.5px solid #374151", minHeight: "20px", marginBottom: "12px" }}>&nbsp;</div>

        {/* Risks */}
        <div style={{ fontSize: "10pt", fontWeight: "700", color: "#5b21b6", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #ede9fe", paddingBottom: "3px", margin: "12px 0 7px", fontFamily: "Arial, sans-serif" }}>Risks &amp; Potential Side Effects</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
          <ul style={{ margin: "4px 0 7px 18px", fontSize: "10.5pt", fontFamily: "Arial, sans-serif" }}>
            <li style={{ marginBottom: "3px" }}>Bruising, swelling, redness at injection site</li>
            <li style={{ marginBottom: "3px" }}>Tenderness or discomfort</li>
            <li style={{ marginBottom: "3px" }}>Lumps, nodules, or granuloma formation</li>
            <li style={{ marginBottom: "3px" }}>Asymmetry or uneven result</li>
            <li style={{ marginBottom: "3px" }}>Infection (rare)</li>
          </ul>
          <ul style={{ margin: "4px 0 7px 18px", fontSize: "10.5pt", fontFamily: "Arial, sans-serif" }}>
            <li style={{ marginBottom: "3px" }}>Allergic reaction or hypersensitivity</li>
            <li style={{ marginBottom: "3px" }}>Prolonged swelling or firmness</li>
            <li style={{ marginBottom: "3px" }}>Skin discoloration</li>
            <li style={{ marginBottom: "3px" }}>Tyndall effect (bluish tint if too superficial)</li>
            <li style={{ marginBottom: "3px" }}>Vascular occlusion (rare, serious)</li>
          </ul>
        </div>

        {/* Skin Test */}
        <div style={{ fontSize: "10pt", fontWeight: "700", color: "#5b21b6", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #ede9fe", paddingBottom: "3px", margin: "12px 0 7px", fontFamily: "Arial, sans-serif" }}>Skin Test Requirement</div>
        <p style={{ marginBottom: "7px", fontSize: "10.5pt", fontFamily: "Arial, sans-serif" }}>Bellafill contains bovine collagen and requires a skin test at least 28 days before treatment to screen for allergic reactions. A positive skin test means treatment cannot proceed.</p>
        {[
          "I have completed the required skin test and received a negative (cleared) result.",
          "I have signed a separate Skin Test Waiver and understand the risks of proceeding without testing."
        ].map((text, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "7px", margin: "4px 0", fontSize: "10.5pt", fontFamily: "Arial, sans-serif" }}>
            <div style={{ width: "13px", height: "13px", border: "1.5px solid #374151", flexShrink: "0", marginTop: "2px" }}></div>
            <span>{text}</span>
          </div>
        ))}

        {/* Pre/Post */}
        <div style={{ fontSize: "10pt", fontWeight: "700", color: "#5b21b6", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #ede9fe", paddingBottom: "3px", margin: "12px 0 7px", fontFamily: "Arial, sans-serif" }}>Pre- &amp; Post-Treatment Instructions</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
          <div>
            <strong style={{ fontSize: "9.5pt", fontFamily: "Arial, sans-serif" }}>Before Treatment:</strong>
            <ul style={{ margin: "3px 0 7px 18px", fontSize: "10.5pt", fontFamily: "Arial, sans-serif" }}>
              <li style={{ marginBottom: "3px" }}>Avoid blood thinners, aspirin, NSAIDs 7 days prior</li>
              <li style={{ marginBottom: "3px" }}>No alcohol 24 hours before</li>
              <li style={{ marginBottom: "3px" }}>Arrive with clean skin — no makeup</li>
              <li style={{ marginBottom: "3px" }}>Inform provider of all medications and supplements</li>
            </ul>
          </div>
          <div>
            <strong style={{ fontSize: "9.5pt", fontFamily: "Arial, sans-serif" }}>After Treatment:</strong>
            <ul style={{ margin: "3px 0 7px 18px", fontSize: "10.5pt", fontFamily: "Arial, sans-serif" }}>
              <li style={{ marginBottom: "3px" }}>Avoid touching or rubbing treatment area for 6 hours</li>
              <li style={{ marginBottom: "3px" }}>No strenuous exercise for 24 hours</li>
              <li style={{ marginBottom: "3px" }}>Avoid extreme heat (saunas, hot yoga) for 48 hours</li>
              <li style={{ marginBottom: "3px" }}>Apply ice if needed; avoid pressure on treated areas</li>
            </ul>
          </div>
        </div>

        {/* Consent */}
        <div style={{ fontSize: "10pt", fontWeight: "700", color: "#5b21b6", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #ede9fe", paddingBottom: "3px", margin: "12px 0 7px", fontFamily: "Arial, sans-serif" }}>Patient Acknowledgment</div>
        {[
          "I understand that Bellafill is a long-lasting filler and results may not be immediately reversible.",
          "I have disclosed all medical conditions, medications, allergies, and prior filler treatments to my provider.",
          "I understand the risks and benefits described above and have had the opportunity to ask questions.",
          "I understand that individual results vary and no specific outcome is guaranteed.",
          "I am not pregnant, breastfeeding, or planning pregnancy in the near future.",
          "I voluntarily consent to Bellafill treatment today and authorize the provider to perform the procedure."
        ].map((text, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "7px", margin: "4px 0", fontSize: "10.5pt", fontFamily: "Arial, sans-serif" }}>
            <div style={{ width: "13px", height: "13px", border: "1.5px solid #374151", flexShrink: "0", marginTop: "2px" }}></div>
            <span>{text}</span>
          </div>
        ))}

        {/* Signatures */}
        <div style={{ fontSize: "10pt", fontWeight: "700", color: "#5b21b6", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #ede9fe", paddingBottom: "3px", margin: "12px 0 7px", fontFamily: "Arial, sans-serif" }}>Signatures</div>
        {[["Patient Signature", "Date"], ["Provider / Clinician Signature", "Date"]].map(([left, right], i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr", gap: "8px 24px", marginBottom: "16px", alignItems: "end" }}>
            <div>
              <div style={{ borderBottom: "1.5px solid #374151", minHeight: "28px", marginBottom: "3px" }}>&nbsp;</div>
              <div style={{ fontSize: "9pt", color: "#374151", fontWeight: "600", fontFamily: "Arial, sans-serif" }}>{left}</div>
            </div>
            <div>
              <div style={{ borderBottom: "1.5px solid #374151", minHeight: "28px", marginBottom: "3px" }}>&nbsp;</div>
              <div style={{ fontSize: "9pt", color: "#374151", fontWeight: "600", fontFamily: "Arial, sans-serif" }}>{right}</div>
            </div>
          </div>
        ))}

        {/* Footer */}
        <div style={{ marginTop: "10px", borderTop: "1px solid #e5e7eb", paddingTop: "5px", fontSize: "7.5pt", color: "#9ca3af", textAlign: "center", fontFamily: "Arial, sans-serif" }}>
          Contemporary Health Center &nbsp;|&nbsp; 6150 Diamond Center Court #400, Fort Myers, FL 33912 &nbsp;|&nbsp; Ph: 239-561-9191 &nbsp;|&nbsp; Fx: 239-561-9188
        </div>
      </>
    )
  }
};

function getStaticFormHtml(formKey, title) {
  const logo = CHC_LOGO;
  const css = `
    @page { size: letter; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 8.5in; height: 11in; overflow: hidden; background: white; font-family: Arial, sans-serif; font-size: 9.5pt; color: #1a1a1a; line-height: 1.4; }
    .page { width: 8.5in; height: 11in; padding: 0.4in 0.55in; overflow: hidden; }
    .hdr { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #5b21b6; padding-bottom: 8px; margin-bottom: 12px; }
    .hdr img { height: 40px; }
    .hdr-r { text-align: right; }
    .hdr-title { font-size: 14pt; font-weight: bold; color: #5b21b6; line-height: 1.2; }
    .hdr-sub { font-size: 8pt; color: #6b7280; }
    .grid4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 4px 14px; margin-bottom: 10px; }
    .flabel { font-size: 7pt; font-weight: bold; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 2px; }
    .fline { border-bottom: 1.5px solid #374151; height: 16px; }
    .body { font-size: 9.5pt; line-height: 1.4; margin-bottom: 12px; }
    .body p { margin-bottom: 6px; }
    .sig { display: grid; grid-template-columns: 2.5fr 1fr; gap: 6px 16px; margin-bottom: 10px; align-items: end; }
    .sline { border-bottom: 1.5px solid #374151; height: 22px; margin-bottom: 2px; }
    .slabel { font-size: 8pt; color: #374151; font-weight: bold; }
    .footer { margin-top: 10px; border-top: 1px solid #e5e7eb; padding-top: 4px; font-size: 7pt; color: #9ca3af; text-align: center; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  `;

  if (formKey === 'waiver') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title><style>${css}</style></head><body><div class="page">
    <div class="hdr"><img src="${logo}" alt="CHC"><div class="hdr-r"><div class="hdr-title">Bellafill&reg; Skin Test Waiver</div><div class="hdr-sub">Contemporary Health Center | Fort Myers, FL</div></div></div>
    <div class="grid4">
      <div><div class="flabel">Patient Full Name</div><div class="fline"></div></div>
      <div><div class="flabel">Date of Birth</div><div class="fline"></div></div>
      <div><div class="flabel">Date</div><div class="fline"></div></div>
      <div><div class="flabel">Provider</div><div class="fline"></div></div>
    </div>
    <div class="body">
      <p>In many cases it may be appropriate to waive the skin test for Bellafill&reg; even though a 28 day test is recommended by the FDA and the manufacturer. We do not recommend that a patient waive the test if they have a history of multiple allergies or if they have had a past reaction to bovine products or lidocaine.</p>
      <p>The rationale for waiving of the skin test is as follows:</p>
      <p>Allergic reactions to Bellafill&reg; are rare (less than 1%). If symptoms do occur they are generally mild, of short duration, treatable, and not related to the long acting component of Bellafill.</p>
      <p>Even with a single negative skin test a future positive reaction may occur.</p>
      <p>By signing below you are indicating that you are waiving the skin test in order to be treated at this time.</p>
    </div>
    <div class="sig"><div><div class="sline"></div><div class="slabel">Patient Signature</div></div><div><div class="sline"></div><div class="slabel">Date</div></div></div>
    <div class="sig"><div><div class="sline"></div><div class="slabel">Witness Signature</div></div><div><div class="sline"></div><div class="slabel">Date</div></div></div>
    <div class="footer">Contemporary Health Center &nbsp;|&nbsp; 6150 Diamond Center Court #400, Fort Myers, FL 33912 &nbsp;|&nbsp; Ph: 239-561-9191 &nbsp;|&nbsp; Fx: 239-561-9188</div>
    </div></body></html>`;
  }

  // consent form - returns similar static HTML
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title><style>${css}
    .sect { font-size: 9pt; font-weight: bold; color: #5b21b6; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #ede9fe; padding-bottom: 2px; margin: 9px 0 5px; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 20px; }
    .chk { display: flex; align-items: flex-start; gap: 6px; margin: 3px 0; font-size: 9.5pt; }
    .box { width: 12px; height: 12px; border: 1.5px solid #374151; flex-shrink: 0; margin-top: 1px; }
    ul { margin: 3px 0 5px 16px; } li { margin-bottom: 2px; font-size: 9.5pt; }
  </style></head><body><div class="page">
    <div class="hdr"><img src="${logo}" alt="CHC"><div class="hdr-r"><div class="hdr-title">Bellafill&reg; Informed Consent</div><div class="hdr-sub">Contemporary Health Center | Fort Myers, FL</div></div></div>
    <div class="grid4" style="margin-bottom:8px">
      <div><div class="flabel">Patient Full Name</div><div class="fline"></div></div>
      <div><div class="flabel">Date of Birth</div><div class="fline"></div></div>
      <div><div class="flabel">Date</div><div class="fline"></div></div>
      <div><div class="flabel">Provider</div><div class="fline"></div></div>
    </div>
    <div class="sect">What is Bellafill?</div>
    <p style="font-size:9.5pt;margin-bottom:5px">Bellafill is an FDA-approved long-lasting dermal filler for nasolabial folds and acne scars. It contains bovine collagen and PMMA microspheres in a lidocaine gel.</p>
    <div class="sect">Treatment Area(s)</div>
    <div class="flabel" style="margin-bottom:2px">Planned treatment area(s)</div><div class="fline" style="margin-bottom:7px"></div>
    <div class="sect">Risks &amp; Side Effects</div>
    <div class="grid2">
      <ul><li>Bruising, swelling, redness</li><li>Tenderness or discomfort</li><li>Lumps, nodules, granuloma</li><li>Asymmetry or uneven result</li><li>Infection (rare)</li></ul>
      <ul><li>Allergic reaction</li><li>Prolonged swelling or firmness</li><li>Skin discoloration</li><li>Tyndall effect (bluish tint)</li><li>Vascular occlusion (rare)</li></ul>
    </div>
    <div class="sect">Skin Test</div>
    <p style="font-size:9.5pt;margin-bottom:4px">Bellafill requires a skin test at least 28 days before treatment. A positive result means treatment cannot proceed.</p>
    <div class="chk"><div class="box"></div><span>I completed the skin test and received a negative (cleared) result.</span></div>
    <div class="chk"><div class="box"></div><span>I signed a Skin Test Waiver and understand the risks of proceeding without testing.</span></div>
    <div class="sect">Pre &amp; Post Instructions</div>
    <div class="grid2">
      <div><strong style="font-size:8.5pt">Before:</strong><ul><li>Avoid blood thinners/aspirin 7 days prior</li><li>No alcohol 24 hours before</li><li>Arrive with clean skin, no makeup</li><li>Disclose all medications</li></ul></div>
      <div><strong style="font-size:8.5pt">After:</strong><ul><li>Do not touch area for 6 hours</li><li>No strenuous exercise 24 hours</li><li>Avoid heat (sauna, hot yoga) 48 hours</li><li>Ice for swelling; avoid pressure</li></ul></div>
    </div>
    <div class="sect">Patient Acknowledgment</div>
    <div class="chk"><div class="box"></div><span>I understand Bellafill is long-lasting and may not be immediately reversible.</span></div>
    <div class="chk"><div class="box"></div><span>I have disclosed all medical conditions, medications, allergies, and prior fillers.</span></div>
    <div class="chk"><div class="box"></div><span>I understand the risks and benefits and have had the opportunity to ask questions.</span></div>
    <div class="chk"><div class="box"></div><span>I understand individual results vary and no specific outcome is guaranteed.</span></div>
    <div class="chk"><div class="box"></div><span>I am not pregnant or breastfeeding. I voluntarily consent to Bellafill treatment today.</span></div>
    <div class="sect">Signatures</div>
    <div class="sig" style="margin-bottom:8px"><div><div class="sline"></div><div class="slabel">Patient Signature</div></div><div><div class="sline"></div><div class="slabel">Date</div></div></div>
    <div class="sig"><div><div class="sline"></div><div class="slabel">Provider / Clinician Signature</div></div><div><div class="sline"></div><div class="slabel">Date</div></div></div>
    <div class="footer">Contemporary Health Center &nbsp;|&nbsp; 6150 Diamond Center Court #400, Fort Myers, FL 33912 &nbsp;|&nbsp; Ph: 239-561-9191 &nbsp;|&nbsp; Fx: 239-561-9188</div>
    </div></body></html>`;
}

export default function BellafillForms() {
  const [activeForm, setActiveForm] = useState("waiver");
  const form = FORMS[activeForm];

  const handlePrint = () => {
    const win = window.open('', '', 'width=850,height=1100,menubar=no,toolbar=no,location=no,status=no,scrollbars=no');
    const staticHtml = getStaticFormHtml(activeForm, form.title);
    win.document.write(staticHtml);
    win.document.close();
    win.focus();
    setTimeout(function(){ win.print(); }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Page header - hidden on print */}
      <div className="no-print mb-6">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-6 w-6 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-800">Bellafill Forms</h1>
        </div>
        <p className="text-gray-500 text-sm">Select a form, then click Print. Open in a new tab for best results.</p>
      </div>

      {/* Form selector - hidden on print */}
      <div className="no-print flex gap-3 mb-6">
        {Object.entries(FORMS).map(([key, f]) => (
          <button
            key={key}
            onClick={() => setActiveForm(key)}
            className={`px-4 py-2 rounded-lg font-medium text-sm border transition-colors ${
              activeForm === key
                ? "bg-purple-600 text-white border-purple-600"
                : "bg-white text-gray-700 border-gray-300 hover:border-purple-400"
            }`}
          >
            {f.label}
          </button>
        ))}
        <Button onClick={handlePrint} className="ml-auto bg-purple-600 hover:bg-purple-700 text-white gap-2">
          <Printer className="h-4 w-4" />
          Print {form.label}
        </Button>
      </div>

      {/* Printable form */}
      <div className="bg-white rounded-xl shadow border border-gray-100 p-6 print-area" id="print-area">
        {/* Header with logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid #5b21b6", paddingBottom: "8px", marginBottom: "12px" }}>
          <img src={CHC_LOGO} alt="CHC Logo" style={{ height: "44px" }} />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "15pt", fontWeight: "700", color: "#5b21b6", fontFamily: "Arial, sans-serif", lineHeight: "1.2" }}>{form.title}</div>
            <div style={{ fontSize: "8.5pt", color: "#6b7280", fontFamily: "Arial, sans-serif", marginTop: "2px" }}>Contemporary Health Center | Fort Myers, FL</div>
          </div>
        </div>

        {/* Form content */}
        {form.content}
      </div>
    </div>
  );
}
