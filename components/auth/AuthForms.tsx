import { EditIcon, LockIcon } from "@chakra-ui/icons";
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
	const labelColor = useColorModeValue("gray.700", "gray.200");
	const fieldBg = useColorModeValue("gray.50", "#101010");
	const fieldBorder = useColorModeValue("gray.200", "whiteAlpha.300");
	const hoverBg = useColorModeValue("white", "#111111");
	return (
		<FormControl
			isRequired
			isInvalid={!!formik.errors[name] && !!formik.touched[name]}
		>
			<FormLabel htmlFor={name} mb="2" fontSize="sm" fontWeight="600" color={labelColor}>
				{label}
			</FormLabel>
			<Input
				onBlur={formik.handleBlur}
				value={formik.values[name]}
				onChange={formik.handleChange}
				type={type || "text"}
				autoComplete={autoComplete}
				variant="outline"
				size="lg"
				borderRadius="xl"
				bg={fieldBg}
				borderColor={fieldBorder}
				color={labelColor}
				_hover={{ bg: hoverBg, borderColor: "gray.400" }}
				_focus={{ bg: hoverBg, borderColor: "mainorange", boxShadow: "0 0 0 1px #C66B36" }}
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

export const SignUpForm = () => {
	const [agree, setAgree] = useState(false);
	const lang = useLang();
	const toast = useToast();
	const router = useRouter();
	const mutedColor = useColorModeValue("gray.600", "gray.300");
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
							<Text fontSize="sm" color={mutedColor} lineHeight="1.6">
								{lang.auth.agree} <Link href="/policies"><Text as="span" color="mainorange" fontWeight="semibold" textDecoration="underline">{lang.auth.policiesLink}</Text></Link>
							</Text>
						</Checkbox>
					</Flex>

					<SocialAuthButtons mode="signup" termsAccepted={agree} />

					<Flex
						gap="4"
						mt="8"
						direction={{ base: "column", sm: "row" }}
						alignItems="center"
						justify="space-between"
					>
						<Flex gap="1" align="center" fontSize="sm" color={mutedColor}>
							<Text>{lang.auth.have_account}</Text>
							<Link legacyBehavior href="/auth/login" passHref>
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
