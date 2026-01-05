import AftercareLibrary from './pages/AftercareLibrary';
import CheckoutQuote from './pages/CheckoutQuote';
import ClinicDirectory from './pages/ClinicDirectory';
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
import QuotesManagement from './pages/QuotesManagement';
import UserManagement from './pages/UserManagement';
import ViewSharedForm from './pages/ViewSharedForm';
import QuoteDetail from './pages/QuoteDetail';
import AftercareDetail from './pages/AftercareDetail';
import ConsentFormDetail from './pages/ConsentFormDetail';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AftercareLibrary": AftercareLibrary,
    "CheckoutQuote": CheckoutQuote,
    "ClinicDirectory": ClinicDirectory,
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
    "QuotesManagement": QuotesManagement,
    "UserManagement": UserManagement,
    "ViewSharedForm": ViewSharedForm,
    "QuoteDetail": QuoteDetail,
    "AftercareDetail": AftercareDetail,
    "ConsentFormDetail": ConsentFormDetail,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};