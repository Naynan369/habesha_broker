import { SiteNavbar } from "@components/shared/SiteNavbar";

export function NavBar({ logout, user }) {
	return <SiteNavbar mode="dashboard" user={user} onLogout={logout} />;
}
