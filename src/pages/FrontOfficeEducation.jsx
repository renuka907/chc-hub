import React from "react";
import EducationPage from "@/components/EducationPage";
import { Building2 } from "lucide-react";

const CATEGORIES = [
  "General", "Check-In / Check-Out", "Scheduling", "Insurance & Billing",
  "Phone Scripts", "Patient Communication", "Compliance & HIPAA",
  "EHR & Documentation", "Protocols & SOPs", "Onboarding",
];

export default function FrontOfficeEducation() {
  return (
    <EducationPage
      title="Front Office Education"
      subtitle="Front office staff — authorized personnel only"
      permissionKey="front_office_education"
      bucket="front-office-education"
      table="front_office_education_files"
      categories={CATEGORIES}
      icon={Building2}
      accentColor="rose"
    />
  );
}
