import AftercareDetail from './pages/AftercareDetail';
import AftercareLibrary from './pages/AftercareLibrary';
import CheckoutQuote from './pages/CheckoutQuote';
import ClinicDirectory from './pages/ClinicDirectory';
import DiscountManagement from './pages/DiscountManagement';
import EducationDetail from './pages/EducationDetail';
import EducationLibrary from './pages/EducationLibrary';
import EmployeeQuestions from './pages/EmployeeQuestions';
import FAQ from './pages/FAQ';
import Home from './pages/Home';
import InventoryManagement from './pages/InventoryManagement';
import Messaging from './pages/Messaging';
import PricingManagement from './pages/PricingManagement';
import QuoteDetail from './pages/QuoteDetail';
import QuotesManagement from './pages/QuotesManagement';
import UserManagement from './pages/UserManagement';
import ConsentFormDetail from './pages/ConsentFormDetail';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AftercareDetail": AftercareDetail,
    "AftercareLibrary": AftercareLibrary,
    "CheckoutQuote": CheckoutQuote,
    "ClinicDirectory": ClinicDirectory,
    "DiscountManagement": DiscountManagement,
    "EducationDetail": EducationDetail,
    "EducationLibrary": EducationLibrary,
    "EmployeeQuestions": EmployeeQuestions,
    "FAQ": FAQ,
    "Home": Home,
    "InventoryManagement": InventoryManagement,
    "Messaging": Messaging,
    "PricingManagement": PricingManagement,
    "QuoteDetail": QuoteDetail,
    "QuotesManagement": QuotesManagement,
    "UserManagement": UserManagement,
    "ConsentFormDetail": ConsentFormDetail,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};