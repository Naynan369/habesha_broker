import { EditIcon } from "@chakra-ui/icons";
import {
	Flex,
	Checkbox,
	Button,
	Spinner,
	useToast,
	Box,
} from "@chakra-ui/react";
import { useLang } from "@libs/hooks/useLang";
import axios from "axios";
import { Formik } from "formik";
import Link from "next/link";
import router from "next/router";
import { useState } from "react";
import * as yup from "yup";
import { AuthInputField } from "./AuthInputField";

const signUpSchema = yup.object().shape({
	firstName: yup.string().max(100).required("Please Enter your first name"),
	lastName: yup.string().max(100).required("Please Enter your last name"),
	email: yup
		.string()
		.email("Please Enter a valid Email")
		.required("Your Email is required"),
	password: yup
		.string()
		.min(8, "Your password should be minimum of 8 Characters")
		.max(128, "Your password is too long")
		.required("Please Enter Your Password"),
	confirmation: yup
		.string()
		.oneOf([yup.ref("password"), null], "Passwords Must match")
		.required("Please Enter Your password again to confirm"),
});

export const SignUpForm = () => {
	const [agree, setAgree] = useState(false);
	const lang = useLang();
	const toast = useToast();

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
			onSubmit={(values, actions) => {
				actions.setSubmitting(true);
				axios
					.post("/api/user/signUp", { ...values, termsAccepted: agree })
					.then((res) => {
						router.push("/auth/login");
					})
					.catch((err) => {
						toast({
							title: "Error Occurred",
							description: err.response.data.err,
							status: "error",
							isClosable: true,
						});
					})
					.finally(() => {
						actions.setSubmitting(false);
					});
			}}
		>
			{(formik) => (
				<form
					onSubmit={formik.handleSubmit}
					onReset={formik.handleReset}
					style={{
						display: "flex",
						flexDirection: "column",
					}}
				>
					<Flex gap="4" direction={{ base: "column", md: "row" }}>
						<AuthInputField
							formik={formik}
							name="firstName"
							label={lang.auth.firstname}
						/>
						<AuthInputField
							formik={formik}
							name="lastName"
							label={lang.auth.lastname}
						/>
					</Flex>
					<Flex my="5">
						<AuthInputField
							type="email"
							name="email"
							formik={formik}
							label={lang.auth.email}
						/>
					</Flex>
					<Flex gap="4" direction={{ base: "column", md: "row" }}>
						<AuthInputField
							formik={formik}
							name="password"
							type="password"
							label={lang.auth.password}
						/>
						<AuthInputField
							formik={formik}
							type="password"
							name="confirmation"
							label={lang.auth.confirm}
						/>
					</Flex>
					<Flex>
						<Checkbox
							checked={agree}
							onChange={(e) => setAgree((val) => !val)}
							mx="3"
							my={"8"}
						>
							{lang.auth.agree}
						</Checkbox>
					</Flex>

					<Flex
						gap="2"
						direction={["column-reverse", null, "row"]}
						mt="4"
						alignItems={"center"}
					>
						<Link href="/auth/login" passHref>
							<Button as="a" variant="ghost" size="sm">Already Have an Account?</Button>
						</Link>
						<Box flex="1"></Box>
						<Button
							leftIcon={
								formik.isSubmitting ? <Spinner /> : <EditIcon />
							}
							colorScheme="red"
							type="submit"
							disabled={
								!formik.isValid || !agree || formik.isSubmitting
							}
						>
							{formik.isSubmitting
								? "Creating..."
								: lang.auth.create}
						</Button>
					</Flex>
				</form>
			)}
		</Formik>
	);
};
