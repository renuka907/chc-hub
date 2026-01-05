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
import FormTemplates from './pages/FormTemplates';
import Home from './pages/Home';
import InventoryManagement from './pages/InventoryManagement';
import LabTestDirectory from './pages/LabTestDirectory';
import Messaging from './pages/Messaging';
import PricingManagement from './pages/PricingManagement';
import QuoteDetail from './pages/QuoteDetail';
import QuotesManagement from './pages/QuotesManagement';
import UserManagement from './pages/UserManagement';
import ViewSharedForm from './pages/ViewSharedForm';
import ProceduresManagement from './pages/ProceduresManagement';
import ProcedureDetail from './pages/ProcedureDetail';
import __Layout from './Layout.jsx';


export const PAGES = {
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
    "FormTemplates": FormTemplates,
    "Home": Home,
    "InventoryManagement": InventoryManagement,
    "LabTestDirectory": LabTestDirectory,
    "Messaging": Messaging,
    "PricingManagement": PricingManagement,
    "QuoteDetail": QuoteDetail,
    "QuotesManagement": QuotesManagement,
    "UserManagement": UserManagement,
    "ViewSharedForm": ViewSharedForm,
    "ProceduresManagement": ProceduresManagement,
    "ProcedureDetail": ProcedureDetail,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};