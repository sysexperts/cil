import Sidebar from "@/components/Sidebar";
import { getSessionUser } from "@/lib/auth";
import { logout } from "./actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main">
        <div className="userbar">
          <span className="muted">{user?.name || user?.email}</span>
          <form action={logout}>
            <button className="btn btn-sm" type="submit">Abmelden</button>
          </form>
        </div>
        {children}
      </main>
    </div>
  );
}
