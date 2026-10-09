import {
	FormControl,
	FormLabel,
	Input,
	FormErrorMessage,
} from "@chakra-ui/react";
import { FormikProps } from "formik";
import { FC } from "react";

interface IAuthInputField {
	formik: FormikProps<any>;
	name: string;
	label: string;
	type?: string;
	autoComplete?: string;
}

export const AuthInputField: FC<IAuthInputField> = ({
	formik,
	name,
	label,
	type,
	autoComplete,
}) => {
	return (
		<FormControl
			isRequired
			isInvalid={!!formik.errors[name] && !!formik.touched[name]}
		>
			<FormLabel htmlFor={name} mb="2" fontSize="sm" fontWeight="600" color="gray.700">
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
				bg="gray.50"
				_hover={{ bg: "white", borderColor: "gray.400" }}
				_focus={{ bg: "white", borderColor: "mainorange", boxShadow: "0 0 0 1px #C66B36" }}
				name={name}
				id={name}
			/>
			<FormErrorMessage>
				{formik.touched[name] && formik.errors[name]}
			</FormErrorMessage>
		</FormControl>
	);
};
