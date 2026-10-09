import { useEffect, useState } from "react";
import Router from "next/router";
import axios from "axios";
import { IUser } from "@libs/types/user";

export const useUser = () => {
	const [user, setUser] = useState({} as IUser);

	useEffect(() => {
		axios
			.post("/api/auth/authenticate")
			.then((res) => {
				if (res.data?.id) {
					setUser(res.data);
				} else {
					Router.push("/auth/login");
				}
			})
			.catch(() => Router.push("/auth/login"));
	}, []);

	return user;
};
