import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { testName, testCode, category } = body;

        if (!testName) {
            return Response.json({ error: 'Test name required' }, { status: 400 });
        }

        const response = await base44.integrations.Core.InvokeLLM({
            prompt: `Generate the TOP 5 most relevant ICD-10 diagnosis codes that would typically cover or justify the need for this lab test:

Test Name: ${testName}
${testCode ? `Test Code: ${testCode}` : ''}
${category ? `Category: ${category}` : ''}

Return ONLY valid ICD-10 codes (format: letter followed by 2 digits, then optional decimal and 1-2 characters, e.g., Z12.89, R00.0, E04.9).

Rank them by most common/likely reasons this test would be ordered. Think about what conditions or screening scenarios would require this test. For example:
- CBC might be covered under Z00.00 (general adult examination), R50.9 (fever), D64.9 (anemia), Z12.89 (other screening), R07.9 (chest pain)
- TSH might be covered under Z12.89 (screening), E06.9 (thyroiditis), E03.9 (hypothyroidism), R06.0 (dyspnea), E05.90 (hyperthyroidism)
- PSA might be covered under Z12.5 (prostate cancer screening), R94.8 (abnormal results), C61.9 (prostate cancer), R39.83 (urinary retention), B49 (unspecified mycosis)

Return as a JSON array of exactly 5 codes like: ["Z12.89", "R00.0", "E04.9", "D64.9", "R50.9"]`,
            add_context_from_internet: false,
            response_json_schema: {
                type: "object",
                properties: {
                    codes: {
                        type: "array",
                        items: { type: "string" }
                    }
                }
            }
        });

        return Response.json(response);
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});