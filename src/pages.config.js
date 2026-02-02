/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
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
import StaffCheckIn from './pages/StaffCheckIn';
import UserManagement from './pages/UserManagement';
import UserProfile from './pages/UserProfile';
import ViewSharedForm from './pages/ViewSharedForm';
import PapOrderingWizard from './pages/PapOrderingWizard';
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
    "StaffCheckIn": StaffCheckIn,
    "UserManagement": UserManagement,
    "UserProfile": UserProfile,
    "ViewSharedForm": ViewSharedForm,
    "PapOrderingWizard": PapOrderingWizard,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};