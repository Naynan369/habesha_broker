import {
	useToast,
	Box,
	Heading,
	SimpleGrid,
	FormControl,
	FormLabel,
	Textarea,
	Button,
	Spinner,
} from "@chakra-ui/react";
import axios from "axios";
import { Formik } from "formik";
import { FaSave } from "react-icons/fa";
import { InputField } from "../forms/InputField";
import * as yup from "yup";
import { IUser } from "@libs/types/user";
import { FC } from "react";

interface IPersonalInfoUpdate {
	user: IUser;
}

export const PersonalInfoUpdate: FC<IPersonalInfoUpdate> = ({ user }) => {
	const toast = useToast();

	return (
		<Box>
			<Heading fontSize="xl" mb="5">
				Personal Information
			</Heading>
			<Formik
				initialValues={{
					firstName: user.firstName,
					lastName: user.lastName,
					bio: user?.bio || "",
				}}
				validationSchema={yup.object().shape({
					firstName: yup.string().required(),
					lastName: yup.string().required(),
					bio: yup.string(),
				})}
				onSubmit={async (values, action) => {
					action.setSubmitting(true);
					await axios
						.post("/api/user/editProfile", values)
						.then((res) => {
							toast({
								title: "Updated Successfully",
								status: "success",
								isClosable: true,
							});
						})
						.catch((err) => {
							toast({
								title: "Error",
								description: "Check the fields, and try again",
								status: "error",
								isClosable: true,
							});
						})
						.finally(() => {
							action.setSubmitting(false);
						});
				}}
			>
				{(formik) => (
					<form onSubmit={formik.handleSubmit}>
						<SimpleGrid spacing="5" columns={[1, 1, 2]}>
							<InputField
								formik={formik}
								name="firstName"
								label="First Name"
								type="text"
							/>
							<InputField
								formik={formik}
								name="lastName"
								label="Last Name"
								type="text"
							/>
						</SimpleGrid>
						<FormControl my="5">
							<FormLabel>Bio</FormLabel>
							<Textarea
								name="bio"
								value={formik.values.bio}
								onChange={formik.handleChange}
								variant="filled"
							></Textarea>
						</FormControl>
						<Button
							type="submit"
							leftIcon={!formik.isSubmitting && <FaSave />}
							colorScheme="blue"
							disabled={formik.isSubmitting}
						>
							{formik.isSubmitting && (
								<Spinner size="sm" mr="5" />
							)}
							Update Information
						</Button>
					</form>
				)}
			</Formik>
		</Box>
	);
};
