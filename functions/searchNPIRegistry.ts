import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchTerm } = await req.json();

        if (!searchTerm || searchTerm.length < 2) {
            return Response.json({ error: 'Search term must be at least 2 characters' }, { status: 400 });
        }

        // Search NPI Registry with multiple strategies
        let data = null;

        if (searchTerm.match(/^\d+$/)) {
            // If search term is numeric, search by NPI number
            const npiUrl = `https://npiregistry.cms.hhs.gov/api/?version=2.1&limit=20&number=${searchTerm}`;
            const response = await fetch(npiUrl);
            data = await response.json();
        } else {
            // Parse name - try to detect first and last name
            const nameParts = searchTerm.trim().split(/\s+/).filter(p => p);

            if (nameParts.length === 1) {
                // Single word - try as last name first, then as first name
                let npiUrl = `https://npiregistry.cms.hhs.gov/api/?version=2.1&limit=20&last_name=${encodeURIComponent(nameParts[0])}*`;
                let response = await fetch(npiUrl);
                data = await response.json();

                // If no results, try as first name
                if (!data.results || data.results.length === 0) {
                    npiUrl = `https://npiregistry.cms.hhs.gov/api/?version=2.1&limit=20&first_name=${encodeURIComponent(nameParts[0])}*`;
                    response = await fetch(npiUrl);
                    data = await response.json();
                }
            } else {
                // Multiple words - treat first as first name, last as last name
                const firstName = nameParts[0];
                const lastName = nameParts[nameParts.length - 1];

                // Strategy 1: exact first and last name
                let npiUrl = `https://npiregistry.cms.hhs.gov/api/?version=2.1&limit=20&first_name=${encodeURIComponent(firstName)}&last_name=${encodeURIComponent(lastName)}`;
                let response = await fetch(npiUrl);
                data = await response.json();

                // Strategy 2: wildcard on both names
                if (!data.results || data.results.length === 0) {
                    npiUrl = `https://npiregistry.cms.hhs.gov/api/?version=2.1&limit=20&first_name=${encodeURIComponent(firstName)}*&last_name=${encodeURIComponent(lastName)}*`;
                    response = await fetch(npiUrl);
                    data = await response.json();
                }

                // Strategy 3: just last name with wildcard
                if (!data.results || data.results.length === 0) {
                    npiUrl = `https://npiregistry.cms.hhs.gov/api/?version=2.1&limit=20&last_name=${encodeURIComponent(lastName)}*`;
                    response = await fetch(npiUrl);
                    data = await response.json();
                }

                // Strategy 4: last name alone (no wildcard)
                if (!data.results || data.results.length === 0) {
                    npiUrl = `https://npiregistry.cms.hhs.gov/api/?version=2.1&limit=20&last_name=${encodeURIComponent(lastName)}`;
                    response = await fetch(npiUrl);
                    data = await response.json();
                }
            }
        }

        // If no results and search term looks like it could be an org/practice name, try organization search
        if ((!data.results || data.results.length === 0) && !searchTerm.match(/^\d+$/)) {
            const orgUrl = `https://npiregistry.cms.hhs.gov/api/?version=2.1&limit=20&organization_name=${encodeURIComponent(searchTerm)}*`;
            const orgResponse = await fetch(orgUrl);
            data = await orgResponse.json();
        }

        if (!data.results || data.results.length === 0) {
            return Response.json({ results: [] });
        }

        // Transform NPI data to our format
        const providers = data.results.map(result => {
            const basic = result.basic || {};
            const addresses = result.addresses || [];
            const taxonomies = result.taxonomies || [];
            
            // Get primary taxonomy
            const primaryTaxonomy = taxonomies.find(t => t.primary) || taxonomies[0] || {};
            
            // Get practice location (location address) or mailing address
            const practiceAddress = addresses.find(a => a.address_purpose === 'LOCATION') || addresses[0] || {};
            
            return {
                npi: result.number,
                full_name: `${basic.first_name || ''} ${basic.middle_name || ''} ${basic.last_name || ''}`.replace(/\s+/g, ' ').trim(),
                credentials: basic.credential || '',
                specialty: primaryTaxonomy.desc || '',
                taxonomy_code: primaryTaxonomy.code || '',
                phone: practiceAddress.telephone_number ? 
                    `${practiceAddress.telephone_number.substr(0,3)}-${practiceAddress.telephone_number.substr(3,3)}-${practiceAddress.telephone_number.substr(6)}` : '',
                fax: practiceAddress.fax_number ? 
                    `${practiceAddress.fax_number.substr(0,3)}-${practiceAddress.fax_number.substr(3,3)}-${practiceAddress.fax_number.substr(6)}` : '',
                address: practiceAddress.address_1 ? 
                    `${practiceAddress.address_1}${practiceAddress.address_2 ? ' ' + practiceAddress.address_2 : ''}, ${practiceAddress.city}, ${practiceAddress.state} ${practiceAddress.postal_code}` : '',
                city: practiceAddress.city || '',
                state: practiceAddress.state || '',
                zip: practiceAddress.postal_code || '',
            };
        });

        return Response.json({ results: providers });
    } catch (error) {
        console.error('NPI search error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});