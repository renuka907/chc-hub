import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Plus, Pencil, Printer, Phone, MapPin, Building2, Trash2 } from "lucide-react";
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

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Referral.delete(id),
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

  const slugify = (s) => (s || 'other').toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');

  const handleSave = async (form) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, data: form });
    } else {
      await createMutation.mutateAsync(form);
    }
    setOpenForm(false);
    setEditing(null);
  };



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
        <Button onClick={() => { setEditing(null); setOpenForm(true); }} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" /> Add Referral
        </Button>
      </div>

      {groups.length > 0 && (
        <div className="mb-4 -mt-2 overflow-x-auto">
          <div className="flex gap-2 pb-1">
            {groups.map(([spec]) => (
              <Button
                key={spec}
                variant="outline"
                size="sm"
                onClick={() => {
                  const el = document.getElementById(`spec-${slugify(spec)}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                {spec}
              </Button>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-gray-600">Loading referrals...</div>
      ) : groups.length === 0 ? (
        <div className="text-gray-600">No referrals yet. Click "Add Referral" to create one.</div>
      ) : (
        <div className="space-y-10">
          {groups.map(([specialty, items]) => (
            <div key={specialty}>
              <h2 id={`spec-${slugify(specialty)}`} className="text-xl font-semibold text-gray-900 mb-3">{specialty}</h2>
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
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (window.confirm('Delete this referral? This cannot be undone.')) {
                            deleteMutation.mutate(r.id);
                          }
                        }}
                        className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
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
        <div className="fixed inset-0 pointer-events-none">
          <PrintableDocument title="Referral Record" onePage>
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