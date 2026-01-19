import ActivityDashboard from './pages/ActivityDashboard';
import AdminProfile from './pages/AdminProfile';
import AftercareDetail from './pages/AftercareDetail';
import AftercareLibrary from './pages/AftercareLibrary';
import CheckoutQuote from './pages/CheckoutQuote';
import ClinicDirectory from './pages/ClinicDirectory';
import ConsentFormDetail from './pages/ConsentFormDetail';
import DiscountManagement from './pages/DiscountManagement';
import EducationDetail from './pages/EducationDetail';
import EducationLibrary from './pages/EducationLibrary';
import EmployeeQuestions from './pages/EmployeeQuestions';
import FAQ from './pages/FAQ';
import FollowUpDates from './pages/FollowUpDates';
import FormTemplates from './pages/FormTemplates';
import Home from './pages/Home';
import InventoryManagement from './pages/InventoryManagement';
import InventoryReports from './pages/InventoryReports';
import InventoryUsageTracking from './pages/InventoryUsageTracking';
import LabTestDirectory from './pages/LabTestDirectory';
import Library from './pages/Library';
import MedicationCalculator from './pages/MedicationCalculator';
import Messaging from './pages/Messaging';
import PricingManagement from './pages/PricingManagement';
import ProcedureDetail from './pages/ProcedureDetail';
import ProceduresManagement from './pages/ProceduresManagement';
import ProviderReferral from './pages/ProviderReferral';
import QuoteDetail from './pages/QuoteDetail';
import QuotesManagement from './pages/QuotesManagement';
import Reminders from './pages/Reminders';
import Specials from './pages/Specials';
import UserManagement from './pages/UserManagement';
import UserProfile from './pages/UserProfile';
import ViewSharedForm from './pages/ViewSharedForm';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ActivityDashboard": ActivityDashboard,
    "AdminProfile": AdminProfile,
    "AftercareDetail": AftercareDetail,
    "AftercareLibrary": AftercareLibrary,
    "CheckoutQuote": CheckoutQuote,
    "ClinicDirectory": ClinicDirectory,
    "ConsentFormDetail": ConsentFormDetail,
    "DiscountManagement": DiscountManagement,
    "EducationDetail": EducationDetail,
    "EducationLibrary": EducationLibrary,
    "EmployeeQuestions": EmployeeQuestions,
    "FAQ": FAQ,
    "FollowUpDates": FollowUpDates,
    "FormTemplates": FormTemplates,
    "Home": Home,
    "InventoryManagement": InventoryManagement,
    "InventoryReports": InventoryReports,
    "InventoryUsageTracking": InventoryUsageTracking,
    "LabTestDirectory": LabTestDirectory,
    "Library": Library,
    "MedicationCalculator": MedicationCalculator,
    "Messaging": Messaging,
    "PricingManagement": PricingManagement,
    "ProcedureDetail": ProcedureDetail,
    "ProceduresManagement": ProceduresManagement,
    "ProviderReferral": ProviderReferral,
    "QuoteDetail": QuoteDetail,
    "QuotesManagement": QuotesManagement,
    "Reminders": Reminders,
    "Specials": Specials,
    "UserManagement": UserManagement,
    "UserProfile": UserProfile,
    "ViewSharedForm": ViewSharedForm,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};