import { Routes, Route } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import { AppLayout } from "../components/layout/AppLayout";
import DashboardPage from "../features/dashboard/DashboardPage";
import DailyProfitPage from "../features/daily-profit/DailyProfitPage";
import ProductsPage from "../features/products/ProductsPage";
import IntegrationsPage from "../features/integrations/IntegrationsPage";
import SettingsPage from "../features/settings/SettingsPage";

export default function App() {
  return (
    <>
      <Sidebar />
      <AppLayout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/daily-profit" element={<DailyProfitPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </AppLayout>
    </>
  );
}
