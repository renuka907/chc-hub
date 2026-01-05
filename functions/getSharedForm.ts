import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const { token } = await req.json();
        
        if (!token) {
            return Response.json({ error: 'Token is required' }, { status: 400 });
        }

        const base44 = createClientFromRequest(req);
        
        // Find the shared link using service role (no auth required for this endpoint)
        const allLinks = await base44.asServiceRole.entities.SharedFormLink.list();
        const sharedLink = allLinks.find(link => link.share_token === token);
        
        if (!sharedLink) {
            return Response.json({ error: 'Link not found' }, { status: 404 });
        }
        
        if (!sharedLink.is_active) {
            return Response.json({ error: 'Link is inactive' }, { status: 403 });
        }
        
        if (sharedLink.expires_at && new Date(sharedLink.expires_at) < new Date()) {
            return Response.json({ error: 'Link expired' }, { status: 403 });
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
            return Response.json({ error: 'Form content not found' }, { status: 404 });
        }
        
        // Fetch clinic locations if it's a quote
        let locations = [];
        if (sharedLink.entity_type === "Quote") {
            locations = await base44.asServiceRole.entities.ClinicLocation.list();
        }
        
        // Increment view count
        const currentCount = sharedLink.view_count || 0;
        await base44.asServiceRole.entities.SharedFormLink.update(sharedLink.id, {
            view_count: currentCount + 1
        });
        
        return Response.json({
            sharedLink: {
                entity_type: sharedLink.entity_type,
                password: sharedLink.password,
                expires_at: sharedLink.expires_at
            },
            formContent,
            locations
        });
    } catch (error) {
        console.error('Error in getSharedForm:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});