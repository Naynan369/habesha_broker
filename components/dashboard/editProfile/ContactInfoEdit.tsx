import { DeleteIcon } from "@chakra-ui/icons";
import {
	useToast,
	Flex,
	Spinner,
	Icon,
	Heading,
	IconButton,
	HStack,
	Select,
	Input,
	Button,
	Text,
	useColorModeValue,
} from "@chakra-ui/react";
import { CONTACTTYPE } from "@components/ContactInfo";
import { useFetch } from "@libs/hooks/useFetch";
import axios from "axios";
import { useState } from "react";
import { MdAddCircleOutline, MdCancel, MdAddCircle } from "react-icons/md";

export const ContactInfoEdit = ({ user }) => {
	const [adding, setAdding] = useState(false);
	const [type, setType] = useState("TELEGRAM");
	const [value, setValue] = useState("");
	const [update, setUpdate] = useState(0);
	const toast = useToast();
	const surface = useColorModeValue("white", "#0c0c0c");
	const border = useColorModeValue("gray.200", "whiteAlpha.200");
	const textColor = useColorModeValue("maingray", "gray.100");

	const [contactInfos, contactLoading, contactError] = useFetch({
		fetchFunction: async () =>
			await axios.get(`/api/user/contactInfo/${user.id}`),
		dependencies: [update],
	});

	const addContactInfo = async () => {
		await axios
			.post("/api/user/contactInfo/add", {
				infos: [{ contactType: type, value }],
			})
			.then((res) => {
				toast({
					title: "Contact Info Added Successfully",
					status: "success",
				});

				setUpdate(update + 1);

				setValue("");
			})
			.catch((err) => {
				toast({
					title: "Error adding contact Info",
					description: "Check the fields and try again",
					status: "error",
				});
			});
	};

	const deleteContactInfo = async (id: string) => {
		await axios
			.post("/api/user/contactInfo/delete", { id })
			.then((res) => {
				const { msg } = res.data;
				setUpdate(update + 1);
				toast({
					title: "Successfully Deleted",
					status: "success",
				});
			})
			.catch((err) => {
				const error = err.response.data;
				toast({
					title: "Error Deleting Contact Info",
					description: error.err,
					status: "error",
				});
			});
	};

	return (
		<Flex direction="column">
			{contactLoading && <Spinner />}
			{!contactLoading &&
				contactInfos &&
				contactInfos.map((info) => {
					return (
						<Flex
							key={info.id}
							direction="row"
							alignItems="center"
							p="5"
							my="1"
							boxShadow="0 6px 18px rgba(21,42,44,.06)"
							bg={surface}
							border="1px solid"
							borderColor={border}
							color={textColor}
						>
							<Icon boxSize="10" mr="2">
								{CONTACTTYPE[info.contactType].icon}
							</Icon>
							<Flex direction="column" flex="1">
								<Heading size="sm" mb="2">
									{info.contactType}
								</Heading>
								<Text wordBreak={"break-all"} fontSize="sm">
									{info.value}
								</Text>
							</Flex>
							<IconButton
								onClick={() => deleteContactInfo(info.id)}
								ml="2"
								aria-label="Delete Contact Info"
							>
								<DeleteIcon />
							</IconButton>
						</Flex>
					);
				})}

			<Flex my="10" direction="column">
				{adding && (
					<HStack w="full">
						<Select
							value={type}
							variant="filled"
							onChange={(e) => setType(e.target.value)}
						>
							<option value="TELEGRAM">Telegram</option>
							<option value="WHATSAPP">WhatsApp</option>
							<option value="INSTAGRAM">Instagram</option>
							<option value="FACEBOOK">Facebook</option>
							<option value="PHONE_NUMBER">Phone Number</option>
							<option value="ADDRESS">Address</option>
							<option value="EMAIL">Email</option>
						</Select>
						<Input
							value={value}
							onChange={(e) => setValue(e.target.value)}
							variant="filled"
						></Input>
						<IconButton onClick={addContactInfo} aria-label="add">
							<MdAddCircleOutline />
						</IconButton>
					</HStack>
				)}

				<Button
					w="full"
					mt="6"
					colorScheme={adding ? "red" : "blue"}
					leftIcon={adding ? <MdCancel /> : <MdAddCircle />}
					onClick={() => setAdding((val) => !val)}
				>
					{adding ? "Cancel Adding" : "Add Contact Information"}
				</Button>
			</Flex>
		</Flex>
	);
};
