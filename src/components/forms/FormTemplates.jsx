import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const templates = [
    {
        id: 'surgical-consent',
        name: 'Surgical Consent Form',
        content: `<h1 style="text-align: center;">SURGICAL PROCEDURE CONSENT FORM</h1>

<h3>Patient Information</h3>
<p><strong>Patient Name:</strong> _________________________________________</p>
<p><strong>Date of Birth:</strong> _____________________</p>
<p><strong>Medical Record #:</strong> _____________________</p>

<h3>Procedure Information</h3>
<p><strong>Procedure Name:</strong> _________________________________________</p>
<p><strong>Scheduled Date:</strong> _____________________</p>
<p><strong>Physician Name:</strong> _________________________________________</p>

<h3>Consent Statement</h3>
<p>I, the undersigned, hereby authorize and consent to the performance of the above-named surgical procedure. I understand the nature of the procedure, the risks involved, and the expected benefits.</p>

<h3>Risks and Benefits</h3>
<p>The risks of this procedure include, but are not limited to:</p>
<ul>
<li>Infection</li>
<li>Bleeding</li>
<li>Adverse reaction to anesthesia</li>
<li>Scarring</li>
</ul>

<h3>Patient Acknowledgment</h3>
<p>☐ I have had the opportunity to ask questions and have received satisfactory answers.</p>
<p>☐ I understand that no guarantees have been made regarding the outcome.</p>
<p>☐ I consent to the administration of anesthesia.</p>

<p><br/></p>
<p style="border-bottom: 2px solid black; width: 300px; display: inline-block;"></p>
<p><strong>Patient Signature:</strong> _____________________ <strong>Date:</strong> _____________________</p>

<p><br/></p>
<p style="border-bottom: 2px solid black; width: 300px; display: inline-block;"></p>
<p><strong>Witness Signature:</strong> _____________________ <strong>Date:</strong> _____________________</p>`
    },
    {
        id: 'treatment-consent',
        name: 'Treatment Consent Form',
        content: `<h1 style="text-align: center;">CONSENT FOR TREATMENT</h1>

<p><strong>Patient Name:</strong> _________________________________________</p>
<p><strong>Date:</strong> _____________________</p>

<h3>Purpose of Treatment</h3>
<p>I understand that the purpose of the proposed treatment is:</p>
<p>_________________________________________</p>
<p>_________________________________________</p>

<h3>Alternative Options</h3>
<p>The following alternative treatments have been explained to me:</p>
<p>☐ Option 1: _________________________________________</p>
<p>☐ Option 2: _________________________________________</p>
<p>☐ No treatment</p>

<h3>Patient Rights</h3>
<p>I understand that I have the right to:</p>
<ul>
<li>Ask questions about my treatment</li>
<li>Refuse or withdraw consent at any time</li>
<li>Receive a copy of this consent form</li>
</ul>

<p><br/></p>
<p style="border-bottom: 2px solid black; width: 300px; display: inline-block;"></p>
<p><strong>Patient Signature:</strong> _____________________ <strong>Date:</strong> _____________________</p>`
    },
    {
        id: 'hipaa-authorization',
        name: 'HIPAA Authorization',
        content: `<h1 style="text-align: center;">HIPAA AUTHORIZATION FOR RELEASE OF MEDICAL INFORMATION</h1>

<h3>Patient Information</h3>
<p><strong>Patient Name:</strong> _________________________________________</p>
<p><strong>Date of Birth:</strong> _____________________</p>
<p><strong>Address:</strong> _________________________________________</p>

<h3>Information to be Released</h3>
<p>I authorize the release of the following information:</p>
<p>☐ Complete medical record</p>
<p>☐ Lab results</p>
<p>☐ Radiology reports</p>
<p>☐ Other: _________________________________________</p>

<h3>Release To</h3>
<p><strong>Name:</strong> _________________________________________</p>
<p><strong>Organization:</strong> _________________________________________</p>
<p><strong>Address:</strong> _________________________________________</p>

<h3>Purpose of Release</h3>
<p>☐ Continuing medical care</p>
<p>☐ Insurance purposes</p>
<p>☐ Legal proceedings</p>
<p>☐ Personal use</p>

<h3>Expiration</h3>
<p>This authorization expires on: _____________________</p>

<p><br/></p>
<p style="border-bottom: 2px solid black; width: 300px; display: inline-block;"></p>
<p><strong>Patient Signature:</strong> _____________________ <strong>Date:</strong> _____________________</p>`
    },
    {
        id: 'financial-agreement',
        name: 'Financial Agreement',
        content: `<h1 style="text-align: center;">FINANCIAL AGREEMENT</h1>

<p><strong>Patient Name:</strong> _________________________________________</p>
<p><strong>Date:</strong> _____________________</p>

<h3>Payment Responsibility</h3>
<p>I understand that I am financially responsible for all charges whether or not paid by insurance.</p>

<h3>Insurance Information</h3>
<p><strong>Insurance Company:</strong> _________________________________________</p>
<p><strong>Policy Number:</strong> _____________________</p>
<p><strong>Group Number:</strong> _____________________</p>

<h3>Payment Terms</h3>
<p>☐ Payment in full at time of service</p>
<p>☐ Payment plan requested</p>
<p>☐ Insurance to be billed</p>

<h3>Estimated Charges</h3>
<p><strong>Procedure/Service:</strong> _________________________________________</p>
<p><strong>Estimated Cost:</strong> $ _____________________</p>
<p><strong>Insurance Coverage:</strong> $ _____________________</p>
<p><strong>Patient Responsibility:</strong> $ _____________________</p>

<h3>Agreement</h3>
<p>I agree to pay all charges for services rendered. I authorize payment of medical benefits to the provider.</p>

<p><br/></p>
<p style="border-bottom: 2px solid black; width: 300px; display: inline-block;"></p>
<p><strong>Patient Signature:</strong> _____________________ <strong>Date:</strong> _____________________</p>`
    }
];

export default function FormTemplates({ onSelectTemplate }) {
    const [open, setOpen] = React.useState(false);

    const handleSelect = (template) => {
        onSelectTemplate(template.content);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-blue-300 hover:bg-blue-50">
                    <FileText className="w-4 h-4 mr-2" />
                    Use Template
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        Choose a Form Template
                    </DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[400px] pr-4">
                    <div className="grid gap-3">
                        {templates.map((template) => (
                            <button
                                key={template.id}
                                onClick={() => handleSelect(template)}
                                className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{template.name}</h4>
                                        <p className="text-sm text-gray-500 mt-1">Professional template with all required fields</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}