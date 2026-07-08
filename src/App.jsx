import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Login from '@/pages/Login';
import ResetPassword from '@/pages/ResetPassword';
import QuoteView from '@/pages/QuoteView';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

// Map route/page names to permission page IDs
const PAGE_PERMISSION_MAP = {
  'InventoryManagement': 'inventory',
  'InventoryReports': 'inventory',
  'PricingManagement': 'pricing',
  'CheckoutQuote': 'quotes',
  'QuoteDetail': 'quotes',
  'QuotesManagement': 'quotes',
  'Library': 'library',
  'EducationDetail': 'library',
  'AftercareDetail': 'library',
  'ConsentFormDetail': 'library',
  'DocumentPrint': 'library',
  'ClinicDirectory': 'clinicDirectory',
  'DiscountManagement': 'discounts',
  'Procedures': 'procedures',
  'LabTestDirectory': 'labTests',
  'MedicationCalculator': 'medicationCalculator',
  'AnastrozoleProtocolCalculator': 'medicationCalculator',
  'FollowUpDates': 'followUpDates',
  'Reminders': 'reminders',
  'UserManagement': 'users',
  'AdminDashboard': 'admin',
  'Messaging': 'messaging',
};

function PageGuard({ children, pageName }) {
  const { user } = useAuth();
  const permId = PAGE_PERMISSION_MAP[pageName];

  // No permission mapping = always accessible (Home, FAQ, etc.)
  if (!permId) return children;

  // Admin role = always accessible
  const role = user?.role || 'staff';
  if (role === 'admin' || role === 'manager') return children;

  // Check page_permissions
  const perms = (() => {
    try {
      const pp = user?.page_permissions;
      if (!pp) return null;
      return typeof pp === 'string' ? JSON.parse(pp) : pp;
    } catch { return null; }
  })();

  // If no page_permissions set at all, allow access (backwards compatible)
  if (!perms || Object.keys(perms).length === 0) return children;

  // Check if user has 'view' action for this page
  const pagePerms = perms[permId];
  if (pagePerms?.actions?.includes('view')) return children;

  // Blocked
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
        <p className="text-gray-500">You don't have permission to view this page.</p>
        <p className="text-gray-400 text-sm mt-1">Contact your administrator for access.</p>
      </div>
    </div>
  );
}

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}><PageGuard pageName={currentPageName}>{children}</PageGuard></Layout>
  : <PageGuard pageName={currentPageName}>{children}</PageGuard>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isAuthenticated, authError } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Check if current route is ViewSharedForm (public page)
  const isPublicPage = window.location.hash?.includes('ViewSharedForm');

  if (!isAuthenticated && !isPublicPage) {
    return <Login />;
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <Routes>
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/q/:shareCode" element={<QuoteView />} />
            <Route path="/*" element={<AuthenticatedApp />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
