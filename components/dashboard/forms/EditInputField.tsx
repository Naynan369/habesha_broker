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
	placeholder?: string;
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
	placeholder,
	children,
	helpText,
	required,
}) => {
	const fieldBg = useColorModeValue("white", "#0c0c0c");
	const fieldBorder = useColorModeValue("#929fa3", "whiteAlpha.300");
	const fieldText = useColorModeValue("#25383d", "#e8eff0");
	const placeholderText = useColorModeValue("#5b6a70", "#aebdc1");
	const hoverBorder = useColorModeValue("#5f7075", "whiteAlpha.500");
	const controlProps = {
		id: name,
		name,
		value,
		required,
		onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => onChange(event.target.value),
		variant: "filled" as const,
		bg: fieldBg,
		color: fieldText,
		width: "100%",
		minWidth: 0,
		border: "1px solid",
		borderColor: fieldBorder,
		borderRadius: "xl",
		_placeholder: { color: placeholderText, opacity: 1 },
		_hover: { bg: fieldBg, borderColor: hoverBorder },
		_focus: { bg: fieldBg, borderColor: "mainorange", boxShadow: "0 0 0 1px #C66B36" },
		_focusVisible: { bg: fieldBg, borderColor: "mainorange", boxShadow: "0 0 0 1px #C66B36" },
		_invalid: { borderColor: "red.400", boxShadow: "0 0 0 1px var(--chakra-colors-red-400)" },
	};

	return (
		<FormControl isRequired={required} minW="0">
			<FormLabel htmlFor={name} mb="2" fontSize="sm" lineHeight="1.4" fontWeight="semibold" color={fieldText}>
				{title}
			</FormLabel>
			{isTextarea ? (
				<Textarea {...controlProps} minH={{ base: "140px", md: "160px" }} py="3" px="4" resize="vertical" placeholder={placeholder} />
			) : isSelect ? (
				<Select
					{...controlProps}
					h="12"
					sx={{
						width: "100%",
						maxWidth: "100%",
						boxSizing: "border-box",
						paddingInlineStart: "1rem",
						paddingInlineEnd: "2.5rem",
						"& > option": { bg: fieldBg, color: fieldText },
					}}
				>
					{children}
				</Select>
			) : (
				<Input {...controlProps} type={type || "text"} inputMode={type === "number" ? "decimal" : undefined} min={type === "number" ? 0 : undefined} step={type === "number" ? "any" : undefined} h="12" px="4" placeholder={placeholder} />
			)}
			{helpText && <FormHelperText mt="2" color={placeholderText}>{helpText}</FormHelperText>}
		</FormControl>
	);
};
