import { EditIcon } from "@chakra-ui/icons";
import {
	Flex,
	Checkbox,
	Button,
	Spinner,
	useToast,
	Text,
} from "@chakra-ui/react";
import { useLang } from "@libs/hooks/useLang";
import axios from "axios";
import { Formik } from "formik";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import * as yup from "yup";
import { AuthInputField } from "./AuthInputField";

export const SignUpForm = () => {
	const [agree, setAgree] = useState(false);
	const lang = useLang();
	const toast = useToast();
	const router = useRouter();
	const signUpSchema = yup.object().shape({
		firstName: yup
			.string()
			.max(100, lang.auth.name_max)
			.required(lang.auth.first_name_required),
		lastName: yup
			.string()
			.max(100, lang.auth.name_max)
			.required(lang.auth.last_name_required),
		email: yup
			.string()
			.email(lang.auth.email_invalid)
			.required(lang.auth.email_required),
		password: yup
			.string()
			.min(8, lang.auth.password_min)
			.max(128, lang.auth.password_max)
			.required(lang.auth.password_required),
		confirmation: yup
			.string()
			.oneOf([yup.ref("password"), null], lang.auth.password_confirm)
			.required(lang.auth.password_confirm_required),
	});

	return (
		<Formik
			initialValues={{
				firstName: "",
				lastName: "",
				email: "",
				password: "",
				confirmation: "",
			}}
			validationSchema={signUpSchema}
			validateOnBlur
			onSubmit={async (values, actions) => {
				try {
					await axios.post("/api/user/signUp", {
						...values,
						termsAccepted: agree,
					});
					actions.resetForm();
					void router.push("/auth/login", undefined, { locale: router.locale });
				} catch (error) {
					const emailAlreadyExists = error?.response?.status === 409;
					toast({
						title: lang.auth.error_title,
						description: emailAlreadyExists
							? lang.auth.email_exists
							: lang.auth.signup_failed,
						status: "error",
						isClosable: true,
					});
				} finally {
					actions.setSubmitting(false);
				}
			}}
		>
			{(formik) => (
				<form
					onSubmit={formik.handleSubmit}
					style={{
						display: "flex",
						flexDirection: "column",
					}}
				>
					<Flex gap="4" direction={{ base: "column", sm: "row" }}>
						<AuthInputField
							formik={formik}
							name="firstName"
							label={lang.auth.firstname}
							autoComplete="given-name"
						/>
						<AuthInputField
							formik={formik}
							name="lastName"
							label={lang.auth.lastname}
							autoComplete="family-name"
						/>
					</Flex>
					<Flex mt="5" mb="5">
						<AuthInputField
							type="email"
							name="email"
							formik={formik}
							label={lang.auth.email}
							autoComplete="email"
						/>
					</Flex>
					<Flex gap="4" direction={{ base: "column", sm: "row" }}>
						<AuthInputField
							formik={formik}
							name="password"
							type="password"
							label={lang.auth.password}
							autoComplete="new-password"
						/>
						<AuthInputField
							formik={formik}
							type="password"
							name="confirmation"
							label={lang.auth.confirm}
							autoComplete="new-password"
						/>
					</Flex>
					<Flex mt="6">
						<Checkbox
							checked={agree}
							onChange={(event) => setAgree(event.target.checked)}
							colorScheme="orange"
							alignItems="flex-start"
							aria-label={lang.auth.agree}
						>
							<Text fontSize="sm" color="gray.600" lineHeight="1.6">
								{lang.auth.agree}
							</Text>
						</Checkbox>
					</Flex>

					<Flex
						gap="4"
						mt="8"
						direction={{ base: "column", sm: "row" }}
						alignItems="center"
						justify="space-between"
					>
						<Flex gap="1" align="center" fontSize="sm" color="gray.600">
							<Text>{lang.auth.have_account}</Text>
							<Link href="/auth/login" passHref>
								<Button as="a" variant="link" size="sm" color="mainorange" fontWeight="700">
									{lang.auth.sign_in}
								</Button>
							</Link>
						</Flex>
						<Button
							leftIcon={formik.isSubmitting ? <Spinner /> : <EditIcon />}
							bg="mainorange"
							color="white"
							_hover={{ bg: "#ad582a" }}
							borderRadius="xl"
							h="52px"
							px="6"
							type="submit"
							isDisabled={!formik.isValid || !agree || formik.isSubmitting}
							w={{ base: "full", sm: "auto" }}
						>
							{formik.isSubmitting ? lang.auth.creating : lang.auth.create}
						</Button>
					</Flex>
				</form>
			)}
		</Formik>
	);
};
