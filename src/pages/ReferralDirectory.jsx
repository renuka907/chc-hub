import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Plus, Pencil, Printer, Phone, MapPin, Building2 } from "lucide-react";
import PrintableDocument from "../components/PrintableDocument";
import ReferralForm from "../components/referrals/ReferralForm";

export default function ReferralDirectory() {
  const queryClient = useQueryClient();
  const [openForm, setOpenForm] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [printRecord, setPrintRecord] = React.useState(null);

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ['referrals'],
    queryFn: () => base44.entities.Referral.list('-updated_date', 1000)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Referral.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['referrals'] })
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Referral.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['referrals'] })
  });

  const bulkCreateMutation = useMutation({
    mutationFn: (records) => base44.entities.Referral.bulkCreate(records),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['referrals'] })
  });

  const groups = React.useMemo(() => {
    const bySpec = referrals.reduce((acc, r) => {
      const key = (r.specialty || 'Other').trim() || 'Other';
      if (!acc[key]) acc[key] = [];
      acc[key].push(r);
      return acc;
    }, {});
    return Object.entries(bySpec).sort((a,b) => a[0].localeCompare(b[0]));
  }, [referrals]);

  const handleSave = async (form) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, data: form });
    } else {
      await createMutation.mutateAsync(form);
    }
    setOpenForm(false);
    setEditing(null);
  };

  const handleBulkAdd = async () => {
    const records = [
      { doctor_name: "Dr. Robert Brueck", specialty: "Medical Marijuana Card", office_name: "Emerald Medical Center", address: "6842 International Center Blvd, Fort Myers, FL 33912", phone: "(239) 939-5233" },
      { doctor_name: "Dr. Hilany Sojdak", specialty: "Psychiatry", office_name: "Psychiatric Associates of Southwest Florida", address: "6800 Porto Fino Cir, Fort Myers, FL 33912", phone: "(239) 332-4700" },
      { doctor_name: "Dr. Samith Sandadi", specialty: "GYN Oncology", office_name: "Genesis Care", address: "8931 Colonial Center Dr, Fort Myers, FL 33905", phone: "(239) 319-3714" },
      { doctor_name: "Dr. Patricia Sarch", specialty: "Endocrinology", office_name: "Endocrine and Diabetes Care", address: "12559 New Brittany Blvd, Fort Myers, FL 33907", phone: "(239) 333-2580" },
      { doctor_name: "Brian Feiock, MD", specialty: "GI", office_name: "Gastroenterology Associates of S.W. Florida - Fort Myers", address: "4790 Barkley Cir, Fort Myers, FL 33907", phone: "(239) 275-8882" },
      { doctor_name: "Dr. Stephen J. Laquis", specialty: "Ophthalmologist/Oculofacial Plastic and Reconstructive Surgeon", office_name: "Laquis Ophthalmic Plastic and Orbital Surgery", address: "7331 College Pkwy, Fort Myers, FL 33907", phone: "(239) 947-4042" },
      { doctor_name: "Dr. Kevin Lam", specialty: "Podiatry (NAPLES)", office_name: "Dr. Kevin Lam: Family Foot & Leg Center, PA", address: "730 Goodlette–Frank Rd Suite 102, Naples, FL 34102", phone: "(239) 430-3668" },
      { doctor_name: "Dr. Joseph Magnant", specialty: "Vascular Surgeon", office_name: "Vein Specialists", address: "1500 Royal Palm Square Blvd #105, Fort Myers, FL 33919", phone: "(239) 694-8346" },
      { doctor_name: "Dr. Ricardo Novoa", specialty: "PCP", office_name: "Millenium Physician Group", address: "13440 Parker Commons Blvd #101, Fort Myers, FL 33912", phone: "(239) 432-9383" },
      { doctor_name: "Dr. Athan Drimoussis", specialty: "Endocrinology", office_name: "Millenium Physician Group", address: "8380 Riverwalk Park Blvd #200, Fort Myers, FL 33919", phone: "(239) 600-7808" },
      { doctor_name: "Dr. Joseph Kandel", specialty: "Neurology", office_name: "Neurology Office: Joseph Kandel MD & Associates", address: "7250 College Pkwy #3, Fort Myers, FL 33907", phone: "(239) 231-1415" },
      { doctor_name: "Dr. Anais Aurora Badia, MD", specialty: "Dermatology", office_name: "Advanced Dermatology and Cosmetic Surgery", address: "13691 Metropolis Ave, Fort Myers, FL 33912", phone: "(239) 561-3376" },
      { doctor_name: "Dr. Shari Skinner", specialty: "Dermatology", office_name: "Associates in Dermatology", address: "8381 Riverwalk Park Blvd, Suite 101, Fort Myers, FL 33919", phone: "(239) 936-5425" },
      { doctor_name: "Dr. Mark Farmer & Dr. Jeffery Kleinman", specialty: "Orthopedics", office_name: "Orthopedic Center of Florida", address: "12670 Creekside Ln #202, Fort Myers, FL 33919", phone: "(239) 482-2663" },
      { doctor_name: "Dr. Peter Jaffe", specialty: "Physiatrist (NAPLES)", office_name: "Jaffe Sports Medicine", address: "1865 Veterans Park Dr #101, Naples, FL 34109", phone: "(239) 465-0527" },
      { doctor_name: "Dr. Evelyn R. Kessel, MD, FACP", specialty: "GI", office_name: "Gastro Health", address: "7152 Coca Sabal Ln, Fort Myers, FL 33908", phone: "(239) 939-9939" },
      { doctor_name: "Dr. Salvatore Lacagnina", specialty: "PCP - Concierge", office_name: "Dr. Sal Concierge Lifestyle Medicine", address: "9371 Cypress Lake Dr Suite 14, Fort Myers, FL 33919", phone: "(239) 989-9922" },
      { doctor_name: "Dr. Audrey Farahmand", specialty: "Plastic Surgery", office_name: "Farahmand Plastic Surgery", address: "12411 Brantley Commons Ct, Fort Myers, FL 33907", phone: "(239) 332-2388" },
      { doctor_name: "Dr. Ralph Garramone", specialty: "Plastic Surgery", office_name: "Garramone Plastic Surgery", address: "12998 S Cleveland Ave, Fort Myers, FL 33907", phone: "(239) 445-0591" },
      { doctor_name: "Dr. Michael Weiss, MD", specialty: "GI", office_name: "Gastroenterology Associates of S.W. Florida - Fort Myers", address: "4790 Barkley Cir Ste A, Fort Myers, FL 33907", phone: "(239) 275-8882" },
      { doctor_name: "Dr. Anthony J. Anfuso, M.D.", specialty: "ENT/Otolaryngologist", office_name: "Precision HealthCare Specialists", address: "13691 Metro Pkwy #300, Fort Myers, FL 33912", phone: "(239) 291-6970" },
      { doctor_name: "Dr. Robert Allen", specialty: "Psychology/Mental Health", office_name: "Elite DNA Behavioral Health", address: "4310 Metro Pkwy Ste 205, Fort Myers, FL 33916", phone: "(239) 690-6906" },
      { doctor_name: "Dr. Carolyn Langford", specialty: "GU", office_name: "Urologic Solutions", address: "9400 Gladiolus Dr Ste 30, Fort Myers, FL 33908", phone: "(239) 221-0992" },
      { doctor_name: "Dr. Paul Liccini", specialty: "Cardiac", office_name: "Cardiology – Heart Institute at Bass Road (Lee Health)", address: "16261 Bass Rd Suite 300, Fort Myers, FL 33908", phone: "(239) 343-6410" },
      { doctor_name: "Kenneth M. Towe, MD, FACC", specialty: "Cardiac", office_name: "Florida Heart Associates", address: "1550 Barkley Cir, Fort Myers, FL 33907", phone: "(239) 938-2000" }
    ];

    await bulkCreateMutation.mutateAsync(records);
  };

  React.useEffect(() => {
    if (!isLoading && referrals.length === 0 && !localStorage.getItem('referrals_seeded_v1')) {
      handleBulkAdd().then(() => {
        localStorage.setItem('referrals_seeded_v1', '1');
      });
    }
  }, [isLoading, referrals]);

  React.useEffect(() => {
    if (!printRecord) return;
    const t = setTimeout(() => {
      window.print();
      setTimeout(() => setPrintRecord(null), 300);
    }, 200);
    return () => clearTimeout(t);
  }, [printRecord]);

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Referral Directory</h1>
          <p className="text-gray-600">Referring doctors and practices grouped by specialty</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setEditing(null); setOpenForm(true); }} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" /> Add Referral
          </Button>
          <Button variant="outline" onClick={handleBulkAdd} disabled={bulkCreateMutation.isPending}>
            Quick Add Provided List
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-gray-600">Loading referrals...</div>
      ) : groups.length === 0 ? (
        <div className="text-gray-600">No referrals yet. Click "Add Referral" to create one.</div>
      ) : (
        <div className="space-y-10">
          {groups.map(([specialty, items]) => (
            <div key={specialty}>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{specialty}</h2>
              <Separator className="mb-4" />
              <div className="grid gap-3">
                {items.map((r) => (
                  <div key={r.id} className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="text-lg font-medium text-gray-900">{r.doctor_name}</div>
                      <div className="text-sm text-gray-700 flex items-center gap-2"><Building2 className="w-4 h-4 text-purple-600" />{r.office_name}</div>
                      {r.address && (
                        <div className="text-sm text-gray-700 flex items-center gap-2"><MapPin className="w-4 h-4 text-purple-600" />{r.address}</div>
                      )}
                      {r.phone && (
                        <div className="text-sm text-gray-700 flex items-center gap-2"><Phone className="w-4 h-4 text-purple-600" />
                          <a href={`tel:${r.phone}`} className="hover:underline">{r.phone}</a>
                        </div>
                      )}
                      {r.notes && (
                        <div className="text-sm text-gray-600">{r.notes}</div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-3 sm:mt-0">
                      <Button variant="outline" onClick={() => { setEditing(r); setOpenForm(true); }} className="gap-2">
                        <Pencil className="w-4 h-4" /> Edit
                      </Button>
                      <Button variant="outline" onClick={() => setPrintRecord(r)} className="gap-2">
                        <Printer className="w-4 h-4" /> Print
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <ReferralForm
        open={openForm}
        onOpenChange={(v) => { if (!v) { setOpenForm(false); setEditing(null); } else { setOpenForm(true); } }}
        initialData={editing}
        onSave={handleSave}
      />

      {printRecord && (
        <div className="absolute -left-[9999px] top-0">
          <PrintableDocument title="Referral Record">
            <div className="space-y-2 text-base">
              <div className="text-xl font-bold">{printRecord.doctor_name}</div>
              <div><span className="font-semibold">Specialty:</span> {printRecord.specialty}</div>
              <div><span className="font-semibold">Office:</span> {printRecord.office_name}</div>
              {printRecord.address && (<div><span className="font-semibold">Address:</span> {printRecord.address}</div>)}
              {printRecord.phone && (<div><span className="font-semibold">Phone:</span> {printRecord.phone}</div>)}
              {printRecord.notes && (
                <div className="mt-2">
                  <span className="font-semibold">Notes:</span>
                  <p className="whitespace-pre-wrap">{printRecord.notes}</p>
                </div>
              )}
            </div>
          </PrintableDocument>
        </div>
      )}
    </div>
  );
}