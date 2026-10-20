import { SiteNavbar } from "@components/shared/SiteNavbar";

export function Navbar({ user }) {
	return <SiteNavbar mode="public" user={user} />;
}
