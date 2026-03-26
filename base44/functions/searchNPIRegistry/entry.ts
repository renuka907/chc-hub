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

        // Keyword matching for specialties
        const specialtyKeywords = {
            'cardio': '2084A2500X',
            'cardiac': '2084A2500X',
            'heart': '2084A2500X',
            'thoracic': '2084A2600X',
            'chest': '2084A2600X',
            'neuro': '2084N0008X',
            'neurosurgery': '2084N0008X',
            'brain': '2084N0008X',
            'ortho': '2084M0001X',
            'orthopedic': '2084M0001X',
            'bone': '2084M0001X',
            'ent': '2084P0800X',
            'ear': '2084P0800X',
            'nose': '2084P0800X',
            'throat': '2084P0800X',
            'surgery': '2083P0901X',
            'surgeon': '2083P0901X',
            'general surgery': '2084A0401X',
            'anesthesia': '2083X0100X',
            'anesthesiology': '2083X0100X',
            'family medicine': '2084F0202X',
            'family': '2084F0202X',
        };

        // Search NPI Registry with multiple strategies
         let data = null;
         let specialtyFilter = null;

         // Check if search term contains specialty keywords
         const lowerSearchTerm = searchTerm.toLowerCase();
         for (const [keyword, code] of Object.entries(specialtyKeywords)) {
             if (lowerSearchTerm.includes(keyword)) {
                 specialtyFilter = code;
                 break;
             }
         }

         if (searchTerm.match(/^\d+$/)) {
             // If search term is numeric, search by NPI number
             const npiUrl = `https://npiregistry.cms.hhs.gov/api/?version=2.1&limit=20&number=${searchTerm}`;
             const response = await fetch(npiUrl);
             data = await response.json();
         } else {
             // Parse name - try to detect first and last name
             const nameParts = searchTerm.trim().split(/\s+/).filter(p => p && !Object.keys(specialtyKeywords).includes(p.toLowerCase()));

             if (nameParts.length === 0) {
                 // Only specialty keywords provided, search broadly
                 const url = `https://npiregistry.cms.hhs.gov/api/?version=2.1&limit=20&taxonomy_code=${specialtyFilter}`;
                 const response = await fetch(url);
                 data = await response.json();
             } else if (nameParts.length === 1) {
                 // Single word - try multiple strategies
                 const term = nameParts[0];
                 
                 // Strategy 1: Last name with wildcard
                 let npiUrl = `https://npiregistry.cms.hhs.gov/api/?version=2.1&limit=20&last_name=${encodeURIComponent(term)}*`;
                 let response = await fetch(npiUrl);
                 data = await response.json();

                 // Strategy 2: First name with wildcard
                 if (!data.results || data.results.length === 0) {
                     npiUrl = `https://npiregistry.cms.hhs.gov/api/?version=2.1&limit=20&first_name=${encodeURIComponent(term)}*`;
                     response = await fetch(npiUrl);
                     data = await response.json();
                 }

                 // Strategy 3: Last name without wildcard
                 if (!data.results || data.results.length === 0) {
                     npiUrl = `https://npiregistry.cms.hhs.gov/api/?version=2.1&limit=20&last_name=${encodeURIComponent(term)}`;
                     response = await fetch(npiUrl);
                     data = await response.json();
                 }

                 // Strategy 4: First name without wildcard
                 if (!data.results || data.results.length === 0) {
                     npiUrl = `https://npiregistry.cms.hhs.gov/api/?version=2.1&limit=20&first_name=${encodeURIComponent(term)}`;
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

                 // Strategy 4: just first name with wildcard
                 if (!data.results || data.results.length === 0) {
                     npiUrl = `https://npiregistry.cms.hhs.gov/api/?version=2.1&limit=20&first_name=${encodeURIComponent(firstName)}*`;
                     response = await fetch(npiUrl);
                     data = await response.json();
                 }

                 // Strategy 5: last name alone (no wildcard)
                 if (!data.results || data.results.length === 0) {
                     npiUrl = `https://npiregistry.cms.hhs.gov/api/?version=2.1&limit=20&last_name=${encodeURIComponent(lastName)}`;
                     response = await fetch(npiUrl);
                     data = await response.json();
                 }

                 // Strategy 6: first name alone (no wildcard)
                 if (!data.results || data.results.length === 0) {
                     npiUrl = `https://npiregistry.cms.hhs.gov/api/?version=2.1&limit=20&first_name=${encodeURIComponent(firstName)}`;
                     response = await fetch(npiUrl);
                     data = await response.json();
                 }
             }
         }

         // If no results and search term looks like it could be an org/practice name, try organization search
         if ((!data.results || data.results.length === 0) && !searchTerm.match(/^\d+$/) && !specialtyFilter) {
             const orgUrl = `https://npiregistry.cms.hhs.gov/api/?version=2.1&limit=20&organization_name=${encodeURIComponent(searchTerm)}*`;
             const orgResponse = await fetch(orgUrl);
             data = await orgResponse.json();
         }

        if (!data.results || data.results.length === 0) {
            return Response.json({ results: [] });
        }

        // Transform NPI data to our format, filtering for physicians/surgeons in Florida
         const providers = data.results
             .filter(result => {
                 // Filter to include only Florida
                 const addresses = result.addresses || [];
                 const practiceAddress = addresses.find(a => a.address_purpose === 'LOCATION') || addresses[0];
                 if (!practiceAddress || practiceAddress.state !== 'FL') return false;

                 // Filter to include only physicians, surgeons, and related medical providers
                 const taxonomies = result.taxonomies || [];
                 if (taxonomies.length === 0) return true; // Include if no taxonomy info

                 const physicianCodes = [
                     '207Q00000X', // Allopathic & Osteopathic Physicians
                     '2083P0901X', // Physician - Surgery
                     '207R00000X', // Osteopathic Manipulative Treatment Physicians
                     '208000000X', // Physicians
                     '2084A0401X', // Physician - Surgery - General
                     '2084A0402X', // Physician - Surgery - Pediatric
                     '2084A2500X', // Physician - Surgery - Cardiovascular
                     '2084A2600X', // Physician - Surgery - Thoracic
                     '2084N0008X', // Physician - Neurosurgery
                     '2084P0800X', // Physician - Otolaryngology
                     '2084F0202X', // Physician - Family Medicine
                     '2084M0001X', // Physician - Orthopedic Surgery
                     '2083X0100X', // Physician - Anesthesiology
                 ];

                 return taxonomies.some(t => 
                     t.code && (
                         physicianCodes.includes(t.code) || 
                         t.desc?.toLowerCase().includes('physician') ||
                         t.desc?.toLowerCase().includes('surgeon') ||
                         t.desc?.toLowerCase().includes('doctor') ||
                         t.desc?.toLowerCase().includes('md') ||
                         t.desc?.toLowerCase().includes('do')
                     )
                 );
             })
            .map(result => {
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

        return Response.json({ results: providers.slice(0, 20) });
    } catch (error) {
        console.error('NPI search error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});