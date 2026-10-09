import { CheckCircleIcon, CloseIcon } from "@chakra-ui/icons";
import {
	FormControl,
	FormErrorMessage,
	FormHelperText,
	FormLabel,
	Input,
	InputGroup,
	InputRightElement,
	Select,
	Spinner,
	Textarea,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { FC, useState } from "react";
import axios from "axios";

interface IEditInputField {
	title: string;
	name: string;
	defaultValues?: string;
	type?: string;
	isTextarea?: boolean;
	isSelect?: boolean;
	isProductSpecific?: boolean;
	children?: React.ReactNode;
}

export const EditInputField: FC<IEditInputField> = ({
	title,
	name,
	defaultValues,
	type,
	isTextarea,
	isProductSpecific,
	isSelect,
	children,
}) => {
	const { itemId } = useRouter().query;
	const [value, setValue] = useState(defaultValues || "");
	const [saving, setSaving] = useState(false);
	const [edited, setEdited] = useState(false);
	const [error, setError] = useState(false);

	const saveChange = async (nextValue = value) => {
		if (nextValue !== defaultValues && nextValue !== "") {
			setSaving(true);
			setEdited(false);
			setError(false);
			const data = {};

			let val = type === "number" ? parseFloat(nextValue) : nextValue;

			if (!isProductSpecific) {
				data[name] = val;
			} else {
				let specificProps = {};
				specificProps[name] = val;
				data["specificProps"] = { ...specificProps };
			}

			await axios
				.post(
					`/api/items/edit`,
					{
						itemId,
						...data,
					}
				)
				.then((res) => {
					setEdited(true);
				})
				.catch((err) => {
					setError(true);
				})
				.finally(() => {
					setSaving(false);
				});
		}
	};

	const commonAttrs = {
		name,
		value,
		disabled: saving,
		onChange: (e) => setValue(e.target.value),
		onBlur: () => saveChange(),
		variant: "filled",
	};

	return (
		<FormControl>
			<FormLabel textTransform="capitalize">{title}</FormLabel>
			<InputGroup>
				{isTextarea ? (
					<Textarea {...commonAttrs} />
				) : isSelect ? (
					<Select
						{...commonAttrs}
						onChange={(e) => {
							const nextValue = e.target.value;
							setValue(nextValue);
							saveChange(nextValue);
						}}
					>
						{children}
					</Select>
				) : (
					<Input type={type || "text"} {...commonAttrs} />
				)}

				{!isSelect && (
					<InputRightElement>
						{saving ? (
							<Spinner />
						) : error ? (
							<CloseIcon color="red" />
						) : (
							edited && <CheckCircleIcon color="green" />
						)}
					</InputRightElement>
				)}
			</InputGroup>
			{isSelect && error ? (
				<FormErrorMessage>
					Error Updating Value, try again
				</FormErrorMessage>
			) : (
				edited && (
					<FormHelperText color="green.600">
						{title} updated
					</FormHelperText>
				)
			)}
		</FormControl>
	);
};
