import {
	FormControl,
	FormErrorMessage,
	FormHelperText,
	FormLabel,
	Input,
	InputGroup,
	InputLeftElement,
	InputRightElement,
	useColorModeValue,
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
	placeholder?: string;
	helperText?: string;
	required?: boolean;
}

export const InputField: FC<IInputField> = ({
	formik,
	name,
	label,
	type = "text",
	prefix,
	suffix,
	placeholder,
	helperText,
	required,
}) => {
	const fieldBg = useColorModeValue("white", "#0c0c0c");
	const fieldBorder = useColorModeValue("#929fa3", "whiteAlpha.300");
	const fieldText = useColorModeValue("#25383d", "#e8eff0");
	const placeholderText = useColorModeValue("#5b6a70", "#aebdc1");
	const hoverBorder = useColorModeValue("#5f7075", "whiteAlpha.500");
	return (
		<FormControl isRequired={required} isInvalid={!!formik.errors[name] && !!formik.touched[name]}>
			<FormLabel htmlFor={name} mb="2" fontSize="sm" fontWeight="semibold">{label}</FormLabel>
			<InputGroup>
				{prefix && <InputLeftElement>{prefix}</InputLeftElement>}
				<Input
					id={name}
					name={name}
					onChange={formik.handleChange}
					onBlur={formik.handleBlur}
					value={formik.values[name]}
					type={type}
					placeholder={placeholder || label}
					variant="filled"
					h="12"
					px={prefix ? "10" : "4"}
					pr={suffix ? "14" : "4"}
					bg={fieldBg}
					color={fieldText}
					border="1px solid"
					borderColor={fieldBorder}
					borderRadius="xl"
					_placeholder={{ color: placeholderText, opacity: 1 }}
					_hover={{ bg: fieldBg, borderColor: hoverBorder }}
					_focus={{ bg: fieldBg, borderColor: "mainorange", boxShadow: "0 0 0 1px #C66B36" }}
				></Input>
				{suffix && <InputRightElement width="auto" h="12" px="3" pointerEvents="none" color={placeholderText}>{suffix}</InputRightElement>}
			</InputGroup>

			{!!formik.errors[name] && formik.touched[name] && (
				<FormErrorMessage>{String(formik.errors[name])}</FormErrorMessage>
			)}
			{helperText && !(formik.errors[name] && formik.touched[name]) && (
				<FormHelperText mt="2" color={placeholderText}>{helperText}</FormHelperText>
			)}
		</FormControl>
	);
};
