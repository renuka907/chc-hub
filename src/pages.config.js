import AftercareDetail from './pages/AftercareDetail';
import AftercareLibrary from './pages/AftercareLibrary';
import ClinicDirectory from './pages/ClinicDirectory';
import ConsentFormDetail from './pages/ConsentFormDetail';
import DiscountManagement from './pages/DiscountManagement';
import EducationDetail from './pages/EducationDetail';
import EducationLibrary from './pages/EducationLibrary';
import EmployeeQuestions from './pages/EmployeeQuestions';
import FAQ from './pages/FAQ';
import FormTemplates from './pages/FormTemplates';
import Home from './pages/Home';
import Messaging from './pages/Messaging';
import PricingManagement from './pages/PricingManagement';
import ProcedureDetail from './pages/ProcedureDetail';
import ProceduresManagement from './pages/ProceduresManagement';
import QuotesManagement from './pages/QuotesManagement';
import ViewSharedForm from './pages/ViewSharedForm';
import InventoryManagement from './pages/InventoryManagement';
import UserManagement from './pages/UserManagement';
import FollowUpDates from './pages/FollowUpDates';
import CheckoutQuote from './pages/CheckoutQuote';
import QuoteDetail from './pages/QuoteDetail';
import LabTestDirectory from './pages/LabTestDirectory';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AftercareDetail": AftercareDetail,
    "AftercareLibrary": AftercareLibrary,
    "ClinicDirectory": ClinicDirectory,
    "ConsentFormDetail": ConsentFormDetail,
    "DiscountManagement": DiscountManagement,
    "EducationDetail": EducationDetail,
    "EducationLibrary": EducationLibrary,
    "EmployeeQuestions": EmployeeQuestions,
    "FAQ": FAQ,
    "FormTemplates": FormTemplates,
    "Home": Home,
    "Messaging": Messaging,
    "PricingManagement": PricingManagement,
    "ProcedureDetail": ProcedureDetail,
    "ProceduresManagement": ProceduresManagement,
    "QuotesManagement": QuotesManagement,
    "ViewSharedForm": ViewSharedForm,
    "InventoryManagement": InventoryManagement,
    "UserManagement": UserManagement,
    "FollowUpDates": FollowUpDates,
    "CheckoutQuote": CheckoutQuote,
    "QuoteDetail": QuoteDetail,
    "LabTestDirectory": LabTestDirectory,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};