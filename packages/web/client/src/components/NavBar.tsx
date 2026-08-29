import { NavLink } from "react-router-dom";
import { api } from "../api";

export default function NavBar({ onLogout }: { onLogout: () => void }) {
  async function handleLogout() {
    await api.logout();
    onLogout();
  }

  return (
    <header className="app-header">
      <div className="app-header-left">
        <h1>Relationship Intel</h1>
        <nav className="main-nav">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/organizations">Organizations</NavLink>
          <NavLink to="/contacts">Contacts</NavLink>
          <NavLink to="/opportunities">Opportunities</NavLink>
        </nav>
      </div>
      <button className="link-button" onClick={handleLogout}>
        Sign out
      </button>
    </header>
  );
}
