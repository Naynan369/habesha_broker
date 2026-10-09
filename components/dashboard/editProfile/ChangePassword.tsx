import {
	useToast,
	Box,
	Heading,
	Flex,
	SimpleGrid,
	Button,
	Spinner,
	Text,
} from "@chakra-ui/react";
import { useUser } from "@libs/store";
import axios from "axios";
import { Formik } from "formik";
import { MdPassword } from "react-icons/md";
import { InputField } from "../forms/InputField";
import * as yup from "yup";

export const ChangePassword = ({ user }) => {
	const toast = useToast();

	return (
		<Box my="10">
			<Heading fontSize="xl" my="5">
				Change Password
			</Heading>
			<Formik
				validationSchema={yup.object().shape({
					oldPassword: yup.string().min(6).required(),
					newPassword: yup.string().min(8).required(),
					confirmPassword: yup
						.string()
						.required()
						.oneOf([yup.ref("newPassword")], "Password must match"),
				})}
				initialValues={{
					oldPassword: "",
					newPassword: "",
					confirmPassword: "",
				}}
				onSubmit={async (values, actions) => {
					actions.setSubmitting(true);
					await axios
						.post("/api/user/editProfile", values)
						.then((res) => {
							toast({
								title: "Success",
								description: "Password Updated",
								status: "success",
							});
						})
						.catch((err) => {
							const e = err.response.data;
							if (e?.fieldError) {
								actions.setFieldError(e.field, e.msg);
							}

							toast({
								title: "Error",
								description: "Error Updating password",
								status: "error",
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
						onBlur={formik.handleBlur}
					>
						<Flex direction="column">
							<InputField
								formik={formik}
								name="oldPassword"
								label="Old Password"
								type="password"
							/>
							<SimpleGrid
								alignItems={"flex-end"}
								spacing="5"
								columns={[1, 1, 1, 2]}
								my="5"
							>
								<InputField
									formik={formik}
									name="newPassword"
									label="New Password"
									type="password"
								/>

								<InputField
									formik={formik}
									name="confirmPassword"
									label="Confirm Password"
									type="password"
								/>
							</SimpleGrid>
							<Button
								my="5"
								colorScheme="blue"
								leftIcon={
									!formik.isSubmitting && <MdPassword />
								}
								type="submit"
								disabled={formik.isSubmitting}
							>
								{formik.isSubmitting && <Spinner mr="5" />}
								Update Password
							</Button>
						</Flex>
					</form>
				)}
			</Formik>
		</Box>
	);
};
