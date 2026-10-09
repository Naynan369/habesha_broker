export interface IUser {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	bio?: string;
	profile_url?: string;
	role?: "USER" | "ADMIN";
	verfied: boolean;
}
