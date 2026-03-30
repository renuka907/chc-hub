import React from "react";
import EducationPage from "@/components/EducationPage";
import { Stethoscope } from "lucide-react";

const CATEGORIES = [
  "General", "Vitals & Intake", "Phlebotomy", "Injections & Procedures",
  "EHR & Documentation", "Patient Communication", "Safety & Infection Control",
  "Lab Interpretation", "Protocols & SOPs", "Onboarding",
];

export default function MAEducation() {
  return (
    <EducationPage
      title="MA Education"
      subtitle="Medical Assistants — authorized staff only"
      permissionKey="ma_education"
      bucket="ma-education"
      table="ma_education_files"
      categories={CATEGORIES}
      icon={Stethoscope}
      accentColor="teal"
    />
  );
}
