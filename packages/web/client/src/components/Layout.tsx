import { Outlet } from "react-router-dom";
import NavBar from "./NavBar";

export default function Layout({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="app-shell">
      <NavBar onLogout={onLogout} />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
