import React from "react";
import EducationPage from "@/components/EducationPage";
import { GraduationCap } from "lucide-react";

const CATEGORIES = [
  "General", "Thyroid", "Hormone Replacement Therapy", "GLP-1 / Weight Management",
  "Mens Health", "Gynecology", "Lab Interpretation", "Protocols & SOPs",
];

export default function ProviderEducation() {
  return (
    <EducationPage
      title="Provider Education"
      subtitle="Authorized providers only"
      permissionKey="provider_education"
      bucket="provider-education"
      table="provider_education_files"
      categories={CATEGORIES}
      icon={GraduationCap}
      accentColor="indigo"
    />
  );
}
