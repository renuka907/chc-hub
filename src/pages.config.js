import Home from './pages/Home';
import EducationLibrary from './pages/EducationLibrary';
import EducationDetail from './pages/EducationDetail';
import AftercareLibrary from './pages/AftercareLibrary';
import AftercareDetail from './pages/AftercareDetail';
import ConsentFormDetail from './pages/ConsentFormDetail';
import ClinicDirectory from './pages/ClinicDirectory';
import CheckoutQuote from './pages/CheckoutQuote';
import QuoteDetail from './pages/QuoteDetail';
import PricingManagement from './pages/PricingManagement';
import QuotesManagement from './pages/QuotesManagement';
import UserManagement from './pages/UserManagement';
import InventoryManagement from './pages/InventoryManagement';
import DiscountManagement from './pages/DiscountManagement';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "EducationLibrary": EducationLibrary,
    "EducationDetail": EducationDetail,
    "AftercareLibrary": AftercareLibrary,
    "AftercareDetail": AftercareDetail,
    "ConsentFormDetail": ConsentFormDetail,
    "ClinicDirectory": ClinicDirectory,
    "CheckoutQuote": CheckoutQuote,
    "QuoteDetail": QuoteDetail,
    "PricingManagement": PricingManagement,
    "QuotesManagement": QuotesManagement,
    "UserManagement": UserManagement,
    "InventoryManagement": InventoryManagement,
    "DiscountManagement": DiscountManagement,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};