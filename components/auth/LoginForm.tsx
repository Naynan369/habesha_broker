import { LockIcon } from "@chakra-ui/icons";
import {
	FormControl,
	FormLabel,
	Input,
	FormErrorMessage,
	Flex,
	Checkbox,
	Button,
	Spinner,
	useToast,
} from "@chakra-ui/react";
import { useLang } from "@libs/hooks/useLang";
import { useUser } from "@libs/store";
import axios from "axios";
import { Formik } from "formik";
import Link from "next/link";
import { useRouter } from "next/router";
import * as Yup from "yup";
import { AuthInputField } from "./AuthInputField";

const LoginSchema = Yup.object().shape({
	email: Yup.string()
		.email("Please Enter Valid Email")
		.required("Please Enter your Email"),
	password: Yup.string()
		.min(6, "Your password should be minimum of 6 Characters")
		.max(16, "Your password is too long")
		.required("Please Enter Your Password"),
});

const LoginForm = () => {
	const router = useRouter();
	const toast = useToast();
	const lang = useLang();
	const setUser = useUser((state) => state.setUser);

	const handleSubmit = async (values, actions) => {
		await axios
			.post("/api/user/login", values)
			.then((res) => {
				const user = res.data.user;
				setUser(user);
				router.replace(user.role === "ADMIN" ? "/admin" : "/dashboard");
			})
			.catch((error) => {
				const response = error?.response?.data || {};
				const { type } = response;
				const msg = response.err || response.msg || "Email or password is incorrect";
				if (type) {
					actions.setFieldError(type, msg);
				} else {
					toast({
						title: "Error",
						description: msg,
						status: "error",
					});
				}
			})
			.finally(() => {
				actions.setSubmitting(false);
			});
	};

	return (
		<Formik
			initialValues={{
				email: "",
				password: "",
			}}
			onSubmit={handleSubmit}
			validationSchema={LoginSchema}
			validateOnBlur
		>
			{(formik) => (
				<form onSubmit={formik.handleSubmit}>
					<Flex direction={"column"} gap="5">
						<AuthInputField
							formik={formik}
							name="email"
							label={lang.auth.email}
						/>
						<AuthInputField
							formik={formik}
							name="password"
							type="password"
							label={lang.auth.password}
						/>
					</Flex>

					<Flex mt="2" justifyContent={"flex-end"}>
						<Link href={"/auth/forget_password"}>
							{lang.auth.forget}
						</Link>
					</Flex>
					<Flex mt="5">
						<Checkbox defaultChecked colorScheme={"red"}>
							{lang.auth.remember}
						</Checkbox>
					</Flex>

					<Flex justifyContent={"center"} mt="12">
						<Button
							w="full"
							type="submit"
							alignSelf={"center"}
							textTransform={"uppercase"}
							leftIcon={
								!formik.isSubmitting ? (
									<LockIcon />
								) : (
									<Spinner />
								)
							}
							colorScheme={"red"}
							isDisabled={formik.isSubmitting}
						>
							{formik.isSubmitting
								? "Authenticating..."
								: lang.auth.login}
						</Button>
					</Flex>
				</form>
			)}
		</Formik>
	);
};

export { LoginForm };
