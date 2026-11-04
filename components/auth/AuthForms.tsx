import { Button, Checkbox, Flex, FormControl, FormErrorMessage, FormLabel, Input, Spinner, Text, useColorModeValue, useToast } from "@chakra-ui/react";
import { useLang } from "@libs/hooks/useLang";
import { useUser } from "@libs/store";
import axios from "axios";
import { Formik, FormikProps } from "formik";
import Link from "next/link";
import { useRouter } from "next/router";
import { FC, useState } from "react";
import * as Yup from "yup";
import { SocialAuthButtons } from "./SocialAuthButtons";

interface IAuthInputField {
	formik: FormikProps<any>;
	name: string;
	label: string;
	type?: string;
	autoComplete?: string;
}

const AuthInputField: FC<IAuthInputField> = ({
	formik,
	name,
	label,
	type,
	autoComplete,
}) => {
	const labelColor = useColorModeValue("#2b4246", "#d9e2e0");
	const fieldBg = useColorModeValue("#f4f7f5", "#182123");
	const fieldBorder = useColorModeValue("#cdd9d5", "#405053");
	const hoverBg = useColorModeValue("#ffffff", "#1d292b");
	return (
		<FormControl
			isRequired
			isInvalid={!!formik.errors[name] && !!formik.touched[name]}
		>
			<FormLabel htmlFor={name} mb="2" fontSize="sm" fontWeight="700" color={labelColor}>
				{label}
			</FormLabel>
			<Input
				onBlur={formik.handleBlur}
				value={formik.values[name]}
				onChange={formik.handleChange}
				type={type || "text"}
				autoComplete={autoComplete}
				variant="outline"
				h="52px"
				borderRadius="12px"
				bg={fieldBg}
				borderColor={fieldBorder}
				color={labelColor}
				_hover={{ bg: hoverBg, borderColor: "#8ca29e" }}
				_focus={{ bg: hoverBg, borderColor: "#b46c42", boxShadow: "0 0 0 2px rgba(180,108,66,.22)" }}
				name={name}
				id={name}
			/>
			<FormErrorMessage>
				{formik.touched[name] && String(formik.errors[name] || "")}
			</FormErrorMessage>
		</FormControl>
	);
};

const LoginForm = () => {
	const router = useRouter();
	const toast = useToast();
	const lang = useLang();
	const setUser = useUser((state) => state.setUser);
	const primaryBg = useColorModeValue("#1b4145", "#d8b479");
	const primaryHover = useColorModeValue("#28575b", "#e6c68f");
	const primaryText = useColorModeValue("#ffffff", "#172829");
	const linkColor = useColorModeValue("#a4532c", "#e1b57c");
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
							<Text as="a" fontSize="sm" color={linkColor} fontWeight="700" _hover={{ color: linkColor, textDecoration: "underline" }}>
								{lang.auth.forget}
							</Text>
						</Link>
					</Flex>

					<Flex justifyContent="center" mt="7">
						<Button
							w="full"
							type="submit"
							alignSelf="center"
							h="54px"
							borderRadius="12px"
							leftIcon={formik.isSubmitting ? <Spinner /> : undefined}
							bg={primaryBg}
							color={primaryText}
							fontWeight="800"
							_hover={{ bg: primaryHover, color: primaryText }}
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

export const SignUpForm = () => {
	const [agree, setAgree] = useState(false);
	const lang = useLang();
	const toast = useToast();
	const router = useRouter();
	const mutedColor = useColorModeValue("#617276", "#a6b5b7");
	const linkColor = useColorModeValue("#a4532c", "#e1b57c");
	const primaryBg = useColorModeValue("#1b4145", "#d8b479");
	const primaryHover = useColorModeValue("#28575b", "#e6c68f");
	const primaryText = useColorModeValue("#ffffff", "#172829");
	const borderColor = useColorModeValue("#dce3e0", "#344044");
	const signUpSchema = Yup.object().shape({
		firstName: Yup
			.string()
			.max(100, lang.auth.name_max)
			.required(lang.auth.first_name_required),
		lastName: Yup
			.string()
			.max(100, lang.auth.name_max)
			.required(lang.auth.last_name_required),
		email: Yup
			.string()
			.email(lang.auth.email_invalid)
			.required(lang.auth.email_required),
		password: Yup
			.string()
			.min(8, lang.auth.password_min)
			.max(128, lang.auth.password_max)
			.required(lang.auth.password_required),
		confirmation: Yup
			.string()
			.oneOf([Yup.ref("password"), null], lang.auth.password_confirm)
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
				<form onSubmit={formik.handleSubmit}>
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
							size="lg"
							sx={{ ".chakra-checkbox__control": { width: "20px", height: "20px", flexShrink: 0 } }}
							isChecked={agree}
							onChange={(event) => setAgree(event.target.checked)}
							colorScheme="orange"
							alignItems="flex-start"
							aria-label={lang.auth.agree}
						>
							<Text fontSize="sm" color={mutedColor} lineHeight="1.6">
								{lang.auth.agree} <Link href="/policies"><Text as="span" color={linkColor} fontWeight="semibold" textDecoration="underline">{lang.auth.policiesLink}</Text></Link>
							</Text>
						</Checkbox>
					</Flex>

					<Button mt="7" leftIcon={formik.isSubmitting ? <Spinner /> : undefined} bg={primaryBg} color={primaryText} _hover={{ bg: primaryHover, color: primaryText }} borderRadius="12px" h="54px" w="full" fontWeight="800" type="submit" isDisabled={!formik.isValid || !agree || formik.isSubmitting}>
						{formik.isSubmitting ? lang.auth.creating : lang.auth.create}
					</Button>

					<SocialAuthButtons mode="signup" termsAccepted={agree} />

					<Flex mt="8" pt="6" borderTop="1px solid" borderColor={borderColor} align="center" justify="center" wrap="wrap" gap="2" fontSize="sm" color={mutedColor}>
						<Text>{lang.auth.have_account}</Text>
						<Link legacyBehavior href="/auth/login" passHref>
							<Button as="a" variant="link" size="sm" color={linkColor} fontWeight="700" _hover={{ color: linkColor, textDecoration: "underline" }}>
								{lang.auth.sign_in}
							</Button>
						</Link>
					</Flex>
				</form>
			)}
		</Formik>
	);
};
