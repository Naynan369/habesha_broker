import {
	FormControl,
	FormErrorMessage,
	FormLabel,
	Input,
	InputGroup,
	InputLeftElement,
	InputRightElement,
} from "@chakra-ui/react";
import { FormikProps } from "formik";
import { FC } from "react";

interface IInputField {
	formik: FormikProps<any>;
	name: string;
	label: string;
	type?: string;
	prefix?: React.ReactNode;
	suffix?: React.ReactNode;
}

export const InputField: FC<IInputField> = ({
	formik,
	name,
	label,
	type = "text",
	prefix,
	suffix,
}) => {
	return (
		<FormControl
			isInvalid={!!formik.errors[name] && !!formik.touched[name]}
		>
			<FormLabel>{label}</FormLabel>
			<InputGroup>
				{prefix && <InputLeftElement>{prefix}</InputLeftElement>}
				<Input
					name={name}
					onChange={formik.handleChange}
					value={formik.values[name]}
					type={type}
					variant={"filled"}
				></Input>
				{suffix && <InputRightElement>{suffix}</InputRightElement>}
			</InputGroup>

			{!!formik.errors[name] && formik.touched[name] && (
				<FormErrorMessage>{formik.errors[name]}</FormErrorMessage>
			)}
		</FormControl>
	);
};
