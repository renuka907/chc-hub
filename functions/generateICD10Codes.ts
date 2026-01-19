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
            prompt: `Generate 3-5 relevant ICD-10 diagnosis codes that would typically cover or justify the need for this lab test:

Test Name: ${testName}
${testCode ? `Test Code: ${testCode}` : ''}
${category ? `Category: ${category}` : ''}

Return ONLY valid ICD-10 codes (format: letter followed by 2 digits, then optional decimal and 1-2 characters, e.g., Z12.89, R00.0, E04.9).

Think about what conditions or screening scenarios would require this test. For example:
- CBC might be covered under Z00.00 (general adult examination), R50.9 (fever), or D64.9 (anemia)
- TSH might be covered under Z12.89 (encounter for other specified screening), E06.9 (thyroiditis), or E03.9 (hypothyroidism)
- PSA might be covered under Z12.5 (encounter for screening for malignant neoplasm of prostate) or R94.8 (abnormal test results)

Return as a JSON array like: ["Z12.89", "R00.0", "E04.9"]`,
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