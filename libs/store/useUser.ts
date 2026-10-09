import { IUser } from "@libs/types/user";
import create from "zustand";
import { persist } from "zustand/middleware";

interface UserState {
	user: IUser;
	setUser: (newUser: IUser) => void;
	logout: () => void;
}

const useUser = create<UserState>()(
	persist(
		(set) => ({
			user: {} as IUser,
			setUser: (user: IUser) => set({ user }),
			logout: () => set({ user: {} as IUser }),
		}),
		{ name: "user-session" }
	)
);

export default useUser;
