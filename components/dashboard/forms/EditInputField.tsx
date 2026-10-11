import {
	FormControl,
	FormHelperText,
	FormLabel,
	Input,
	Select,
	Textarea,
	useColorModeValue,
} from "@chakra-ui/react";
import { ChangeEvent, FC, ReactNode } from "react";

interface IEditInputField {
	title: string;
	name: string;
	value: string;
	onChange: (value: string) => void;
	type?: string;
	isTextarea?: boolean;
	isSelect?: boolean;
	children?: ReactNode;
	helpText?: string;
	required?: boolean;
}

/** Controlled edit field; the page submits all edits together from one Save button. */
export const EditInputField: FC<IEditInputField> = ({
	title,
	name,
	value,
	onChange,
	type,
	isTextarea,
	isSelect,
	children,
	helpText,
	required,
}) => {
	const fieldBg = useColorModeValue("white", "#17262b");
	const fieldBorder = useColorModeValue("gray.300", "whiteAlpha.300");
	const fieldText = useColorModeValue("#25383d", "#e8eff0");
	const placeholderText = useColorModeValue("gray.500", "gray.400");
	const hoverBorder = useColorModeValue("gray.400", "whiteAlpha.500");
	const controlProps = {
		id: name,
		name,
		value,
		required,
		onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => onChange(event.target.value),
		variant: "filled" as const,
		bg: fieldBg,
		color: fieldText,
		border: "1px solid",
		borderColor: fieldBorder,
		borderRadius: "xl",
		_placeholder: { color: placeholderText, opacity: 1 },
		_hover: { bg: fieldBg, borderColor: hoverBorder },
		_focus: { bg: fieldBg, borderColor: "mainorange", boxShadow: "0 0 0 1px #C66B36" },
	};

	return (
		<FormControl isRequired={required} minW="0">
			<FormLabel htmlFor={name} mb="2" fontSize="sm" fontWeight="semibold">
				{title}
			</FormLabel>
			{isTextarea ? (
				<Textarea {...controlProps} minH="32" py="3" px="4" resize="vertical" placeholder={title} />
			) : isSelect ? (
				<Select {...controlProps} h="12" px="4">{children}</Select>
			) : (
				<Input {...controlProps} type={type || "text"} min={type === "number" ? 0 : undefined} step={type === "number" ? "any" : undefined} h="12" px="4" placeholder={title} />
			)}
			{helpText && <FormHelperText mt="2" color={placeholderText}>{helpText}</FormHelperText>}
		</FormControl>
	);
};
