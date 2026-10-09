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
}

export const AuthInputField: FC<IAuthInputField> = ({
	formik,
	name,
	label,
	type,
}) => {
	return (
		<FormControl
			isInvalid={!!formik.errors[name] && !!formik.touched[name]}
		>
			<FormLabel htmlFor={name}>{label}</FormLabel>
			<Input
				onBlur={formik.handleBlur}
				value={formik.values[name]}
				onChange={formik.handleChange}
				type={type ? type : "text"}
				variant="flushed"
				name={name}
				id={name}
			></Input>
			<FormErrorMessage>
				{formik.touched[name] && formik.errors[name]}
			</FormErrorMessage>
		</FormControl>
	);
};
