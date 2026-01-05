import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        // Parse token from URL
        const url = new URL(req.url);
        const token = url.searchParams.get('token');
        const password = url.searchParams.get('password');
        
        if (!token) {
            return new Response(errorPage('Invalid Link', 'This share link is invalid or has been removed.'), {
                status: 400,
                headers: { 'Content-Type': 'text/html' }
            });
        }

        const base44 = createClientFromRequest(req);
        
        // Find the shared link using service role (no auth required)
        const allLinks = await base44.asServiceRole.entities.SharedFormLink.list();
        const sharedLink = allLinks.find(link => link.share_token === token);
        
        if (!sharedLink || !sharedLink.is_active) {
            return new Response(errorPage('Link Not Available', 'This share link has been disabled or does not exist.'), {
                status: 404,
                headers: { 'Content-Type': 'text/html' }
            });
        }
        
        if (sharedLink.expires_at && new Date(sharedLink.expires_at) < new Date()) {
            return new Response(errorPage('Link Expired', `This share link expired on ${new Date(sharedLink.expires_at).toLocaleString()}.`), {
                status: 403,
                headers: { 'Content-Type': 'text/html' }
            });
        }
        
        // Check password if required
        if (sharedLink.password && password !== sharedLink.password) {
            return new Response(passwordPage(token), {
                status: 200,
                headers: { 'Content-Type': 'text/html' }
            });
        }
        
        // Fetch the actual form content
        let formContent = null;
        if (sharedLink.entity_type === "ConsentForm") {
            const forms = await base44.asServiceRole.entities.ConsentForm.list();
            formContent = forms.find(f => f.id === sharedLink.entity_id);
        } else if (sharedLink.entity_type === "AftercareInstruction") {
            const instructions = await base44.asServiceRole.entities.AftercareInstruction.list();
            formContent = instructions.find(i => i.id === sharedLink.entity_id);
        } else if (sharedLink.entity_type === "Quote") {
            const quotes = await base44.asServiceRole.entities.Quote.list();
            formContent = quotes.find(q => q.id === sharedLink.entity_id);
        }
        
        if (!formContent) {
            return new Response(errorPage('Form Not Found', 'The shared form could not be found.'), {
                status: 404,
                headers: { 'Content-Type': 'text/html' }
            });
        }
        
        // Fetch clinic locations if it's a quote
        let location = null;
        if (sharedLink.entity_type === "Quote") {
            const locations = await base44.asServiceRole.entities.ClinicLocation.list();
            location = locations.find(l => l.id === formContent.clinic_location_id);
        }
        
        // Increment view count
        const currentCount = sharedLink.view_count || 0;
        await base44.asServiceRole.entities.SharedFormLink.update(sharedLink.id, {
            view_count: currentCount + 1
        });
        
        // Return HTML page with the form
        return new Response(renderFormPage(sharedLink, formContent, location), {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
        });
    } catch (error) {
        console.error('Error in getSharedForm:', error);
        return new Response(errorPage('Error', error.message), {
            status: 500,
            headers: { 'Content-Type': 'text/html' }
        });
    }
});

function errorPage(title, message) {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .card { background: white; border-radius: 12px; padding: 40px; max-width: 500px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); text-align: center; }
        h1 { color: #1f2937; margin-bottom: 10px; }
        p { color: #6b7280; }
    </style>
</head>
<body>
    <div class="card">
        <h1>${title}</h1>
        <p>${message}</p>
    </div>
</body>
</html>`;
}

function passwordPage(token) {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Required</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .card { background: white; border-radius: 12px; padding: 40px; max-width: 500px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        h1 { color: #1f2937; margin-bottom: 10px; text-align: center; }
        p { color: #6b7280; text-align: center; margin-bottom: 30px; }
        input { width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 16px; margin-bottom: 20px; }
        button { width: 100%; background: #8b5cf6; color: white; padding: 12px; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; }
        button:hover { background: #7c3aed; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Password Required</h1>
        <p>This form is password protected.</p>
        <form method="GET">
            <input type="hidden" name="token" value="${token}">
            <input type="password" name="password" placeholder="Enter password" required autofocus>
            <button type="submit">Unlock Form</button>
        </form>
    </div>
</body>
</html>`;
}

function renderFormPage(sharedLink, formContent, location) {
    let content = '';
    let title = '';
    
    if (sharedLink.entity_type === "ConsentForm") {
        title = formContent.form_name;
        content = formContent.content;
    } else if (sharedLink.entity_type === "AftercareInstruction") {
        title = formContent.procedure_name;
        content = `
            ${formContent.instructions ? `<h3>Instructions</h3><div>${formContent.instructions}</div>` : ''}
            ${formContent.warning_signs ? `<h3>Warning Signs</h3><div>${formContent.warning_signs}</div>` : ''}
            ${formContent.follow_up ? `<h3>Follow-up</h3><div>${formContent.follow_up}</div>` : ''}
        `;
    } else if (sharedLink.entity_type === "Quote") {
        title = `Quote ${formContent.quote_number}`;
        const items = JSON.parse(formContent.items || '[]');
        const itemsHtml = items.map(item => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                    <strong>${item.name}</strong>
                    ${item.tier_name ? `<br><span style="font-size: 14px; color: #6b7280;">${item.tier_name}</span>` : ''}
                </td>
                <td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.quantity}</td>
                <td style="text-align: right; padding: 12px; border-bottom: 1px solid #e5e7eb;">$${item.price.toFixed(2)}</td>
                <td style="text-align: right; padding: 12px; border-bottom: 1px solid #e5e7eb;"><strong>$${(item.price * item.quantity).toFixed(2)}</strong></td>
            </tr>
        `).join('');
        
        content = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb;">
                <div><div style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Quote Number</div><div style="font-weight: bold; font-size: 18px;">${formContent.quote_number}</div></div>
                <div><div style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Date</div><div style="font-weight: 600;">${new Date().toLocaleDateString()}</div></div>
                ${formContent.patient_name ? `<div><div style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Patient Name</div><div style="font-weight: 600;">${formContent.patient_name}</div></div>` : ''}
                ${location ? `<div><div style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Clinic Location</div><div style="font-weight: 600;">${location.name}</div></div>` : ''}
            </div>
            <h3 style="font-weight: bold; font-size: 18px; margin-bottom: 20px;">Items</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <thead style="background: #f3f4f6;">
                    <tr>
                        <th style="text-align: left; padding: 12px; font-weight: 600;">Item</th>
                        <th style="text-align: center; padding: 12px; font-weight: 600;">Qty</th>
                        <th style="text-align: right; padding: 12px; font-weight: 600;">Price</th>
                        <th style="text-align: right; padding: 12px; font-weight: 600;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
            </table>
            ${formContent.show_totals !== false ? `
                <div style="display: flex; justify-content: flex-end;">
                    <div style="width: 300px;">
                        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                            <span>Subtotal:</span><span style="font-weight: 600;">$${formContent.subtotal.toFixed(2)}</span>
                        </div>
                        ${formContent.discount_amount > 0 ? `
                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #10b981;">
                                <span>Discount:</span><span style="font-weight: 600;">-$${formContent.discount_amount.toFixed(2)}</span>
                            </div>
                        ` : ''}
                        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                            <span>Tax (${location?.tax_rate || 0}%):</span><span style="font-weight: 600;">$${formContent.tax_amount.toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 12px 0; font-size: 20px; font-weight: bold; color: #1e40af; border-top: 2px solid #1e40af; margin-top: 8px;">
                            <span>Total:</span><span>$${formContent.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            ` : ''}
            ${formContent.notes ? `<div style="background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin-top: 30px;"><div style="font-weight: 600; margin-bottom: 10px;">Notes:</div><div style="color: #374151; white-space: pre-wrap;">${formContent.notes}</div></div>` : ''}
        `;
    }
    
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: 'Times New Roman', serif; background: linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%); min-height: 100vh; padding: 40px 20px; }
        .container { max-width: 900px; margin: 0 auto; }
        .header { background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header h1 { margin: 0 0 5px 0; color: #1f2937; font-size: 24px; }
        .header p { margin: 0; color: #6b7280; }
        .content { background: white; border: 2px solid black; border-radius: 8px; padding: 60px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .logo { text-align: center; margin-bottom: 30px; }
        .logo img { height: 60px; }
        .clinic-info { text-align: center; font-size: 11px; color: #374151; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #d1d5db; }
        .clinic-info div { margin: 3px 0; }
        h3 { font-size: 16px; font-weight: bold; margin: 25px 0 15px 0; color: #1f2937; }
        .footer { text-align: center; font-size: 11px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #d1d5db; }
        .print-btn { background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; margin-bottom: 20px; }
        .print-btn:hover { background: #2563eb; }
        @media print {
            body { background: white; padding: 0; }
            .header, .print-btn { display: none; }
            .container { max-width: 100%; }
            .content { border: 2px solid black; box-shadow: none; page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
            <p>${sharedLink.entity_type === "ConsentForm" ? "Consent Form" : sharedLink.entity_type === "Quote" ? "Price Quote" : "Aftercare Instructions"}</p>
        </div>
        <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
        <div class="content">
            <div class="logo">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695939a556b8082002a35a68/1e5584b38_goldwithlettersContemporary-health-center-logo-retina.png" alt="Contemporary Health Center">
            </div>
            <div class="clinic-info">
                <div style="font-weight: 600;">6150 Diamond Center Court #400, Fort Myers, FL 33912</div>
                <div>Phone: 239-561-9191 | Fax: 239-561-9188</div>
                <div>contemporaryhealthcenter.com</div>
            </div>
            ${content}
            <div class="footer">
                <p style="font-weight: 600;">Contemporary Health Center | Phone: 239-561-9191 | Email: office@contemporaryhealthcenter.com</p>
                <p style="margin-top: 5px;">Document Generated: ${new Date().toLocaleDateString()}</p>
            </div>
        </div>
    </div>
</body>
</html>`;
}