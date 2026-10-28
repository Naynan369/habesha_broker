import { LockIcon } from "@chakra-ui/icons";
import {
	Flex,
	Button,
	Spinner,
	Text,
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
import { SocialAuthButtons } from "./SocialAuthButtons";

const LoginForm = () => {
	const router = useRouter();
	const toast = useToast();
	const lang = useLang();
	const setUser = useUser((state) => state.setUser);
	const loginSchema = Yup.object().shape({
		email: Yup.string()
			.email(lang.auth.email_invalid)
			.required(lang.auth.email_required),
		password: Yup.string().required(lang.auth.password_required),
	});

	const handleSubmit = async (values, actions) => {
		try {
			const response = await axios.post("/api/user/login", values);
			const user = response.data.user;
			setUser(user);
			const destination = user.role === "ADMIN" ? "/admin" : "/dashboard";
			await router.replace(destination, destination, { locale: router.locale });
		} catch {
			toast({
				title: lang.auth.error_title,
				description: lang.auth.login_failed,
				status: "error",
				isClosable: true,
			});
		} finally {
			actions.setSubmitting(false);
		}
	};

	return (
		<Formik
			initialValues={{
				email: "",
				password: "",
			}}
			onSubmit={handleSubmit}
			validationSchema={loginSchema}
			validateOnBlur
		>
			{(formik) => (
				<form onSubmit={formik.handleSubmit}>
					<Flex direction="column" gap="5">
						<AuthInputField
							formik={formik}
							name="email"
							label={lang.auth.email}
							type="email"
							autoComplete="email"
						/>
						<AuthInputField
							formik={formik}
							name="password"
							type="password"
							label={lang.auth.password}
							autoComplete="current-password"
						/>
					</Flex>

					<Flex mt="4" justifyContent="flex-end">
						<Link legacyBehavior href="/auth/forget_password" passHref>
							<Text as="a" fontSize="sm" color="mainorange" fontWeight="600" _hover={{ textDecoration: "underline" }}>
								{lang.auth.forget}
							</Text>
						</Link>
					</Flex>

					<Flex justifyContent="center" mt="8">
						<Button
							w="full"
							type="submit"
							alignSelf="center"
							textTransform="uppercase"
							h="54px"
							borderRadius="xl"
							leftIcon={
								!formik.isSubmitting ? (
									<LockIcon />
								) : (
									<Spinner />
								)
							}
							colorScheme="orange"
							bg="mainorange"
							_hover={{ bg: "#ad582a" }}
							isDisabled={formik.isSubmitting}
						>
							{formik.isSubmitting
								? lang.auth.authenticating
								: lang.auth.login}
						</Button>
					</Flex>

					<SocialAuthButtons mode="login" />
				</form>
			)}
		</Formik>
	);
};

export { LoginForm };
