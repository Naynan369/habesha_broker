import {
	FormControl,
	FormLabel,
	Input,
	FormErrorMessage,
	useColorModeValue,
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
