import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { api } from "./api";
import LoginPage from "./pages/LoginPage";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import OrganizationsListPage from "./pages/OrganizationsListPage";
import OrganizationDetailPage from "./pages/OrganizationDetailPage";
import ContactsListPage from "./pages/ContactsListPage";
import ContactDetailPage from "./pages/ContactDetailPage";
import OpportunitiesBoardPage from "./pages/OpportunitiesBoardPage";

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    api
      .session()
      .then((s) => setAuthenticated(s.authenticated))
      .catch(() => setAuthenticated(false));
  }, []);

  if (authenticated === null) {
    return <div className="loading-screen">Loading…</div>;
  }

  if (!authenticated) {
    return <LoginPage onSuccess={() => setAuthenticated(true)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout onLogout={() => setAuthenticated(false)} />}>
          <Route index element={<DashboardPage />} />
          <Route path="organizations" element={<OrganizationsListPage />} />
          <Route path="organizations/:id" element={<OrganizationDetailPage />} />
          <Route path="contacts" element={<ContactsListPage />} />
          <Route path="contacts/:id" element={<ContactDetailPage />} />
          <Route path="opportunities" element={<OpportunitiesBoardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
