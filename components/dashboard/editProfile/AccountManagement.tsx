import { DeleteIcon } from "@chakra-ui/icons";
import {
	AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter,
	AlertDialogHeader, AlertDialogOverlay, Box, Button, FormControl,
	FormLabel, Heading, Input, Text, VStack, useColorModeValue,
	useDisclosure, useToast,
} from "@chakra-ui/react";
import axios from "axios";
import { useUser } from "@libs/store";
import { IUser } from "@libs/types/user";
import { useRouter } from "next/router";
import { FormEvent, useRef, useState } from "react";

export const AccountManagement = ({ user }: { user: IUser }) => {
	const router = useRouter();
	const am = router.locale === "am";
	const toast = useToast();
	const setUser = useUser((state) => state.setUser);
	const logout = useUser((state) => state.logout);
	const { isOpen, onOpen, onClose } = useDisclosure();
	const cancelRef = useRef<HTMLButtonElement>(null);
	const [email, setEmail] = useState("");
	const [currentEmail, setCurrentEmail] = useState(user.email);
	const [password, setPassword] = useState("");
	const [deletePassword, setDeletePassword] = useState("");
	const [phrase, setPhrase] = useState("");
	const [busy, setBusy] = useState(false);
	const surface = useColorModeValue("white", "#17262b");
	const border = useColorModeValue("gray.200", "whiteAlpha.200");
	const muted = useColorModeValue("gray.600", "gray.300");
	const dangerBg = useColorModeValue("red.50", "rgba(197,58,58,.12)");
	const dangerBorder = useColorModeValue("red.200", "rgba(255,120,120,.35)");
	const dangerHeading = useColorModeValue("red.700", "red.200");
	const closeDialog = () => {
		onClose();
		setDeletePassword("");
		setPhrase("");
	};
	const copy = am ? {
		emailTitle: "የመግቢያ ኢሜል", emailHelp: "ኢሜሉን ሲቀይሩ መለያዎ እንደገና ማረጋገጥ ይፈልጋል።",
		current: "የአሁኑ ኢሜል", newEmail: "አዲስ ኢሜል", password: "የአሁኑ የይለፍ ቃል",
		update: "ኢሜልን ቀይር", updated: "ኢሜል ተቀይሯል። አዲሱን አድራሻ ያረጋግጡ።",
		delete: "መለያን ሰርዝ", deleteHelp: "ይህ የመገለጫዎን፣ ያቀረቧቸውን ዝርዝሮችና የተቀመጡ መረጃዎችን በቋሚነት ይሰርዛል።",
		deleteButton: "መለያዬን ሰርዝ", dialog: "መለያዎን በቋሚነት ሰርዝ?",
		confirmText: "ለማረጋገጥ DELETE MY ACCOUNT ብለው ይተይቡ።", keep: "መለያዬን አቆይ",
		confirm: "መለያን ሰርዝ", error: "ስህተት ተፈጥሯል",
	} : {
		emailTitle: "Sign-in email", emailHelp: "Changing your email will require you to verify the new address before using listing tools.",
		current: "Current email", newEmail: "New email address", password: "Current password",
		update: "Update email", updated: "Email updated. Verify the new address to continue using listing tools.",
		delete: "Delete account", deleteHelp: "This permanently removes your profile, saved information, and every listing you posted.",
		deleteButton: "Delete my account", dialog: "Permanently delete your account?",
		confirmText: "This cannot be undone. Type DELETE MY ACCOUNT to confirm.",
		keep: "Keep my account", confirm: "Delete account", error: "Something went wrong",
	};

	const updateEmail = async (event: FormEvent) => {
		event.preventDefault();
		setBusy(true);
		try {
			const response = await axios.post("/api/user/changeEmail", { email, password });
			setUser(response.data.user);
			setCurrentEmail(response.data.user.email);
			setEmail("");
			setPassword("");
			toast({ title: copy.updated, status: "success", isClosable: true });
		} catch (error: any) {
			toast({
				title: copy.error,
				description: error?.response?.data?.err || "Please check the details and try again.",
				status: "error",
				isClosable: true,
			});
		} finally {
			setBusy(false);
		}
	};

	const deleteAccount = async () => {
		setBusy(true);
		try {
			await axios.post("/api/user/deleteAccount", { password: deletePassword, confirmation: phrase });
			logout();
			await router.replace("/");
		} catch (error: any) {
			toast({
				title: copy.error,
				description: error?.response?.data?.err || "Please check the details and try again.",
				status: "error",
				isClosable: true,
			});
		} finally {
			setBusy(false);
		}
	};

	return (
		<VStack align="stretch" spacing="6" my="8">
			<Box bg={surface} border="1px solid" borderColor={border} borderRadius="2xl" boxShadow="sm" p="6">
				<Heading fontSize="xl">{copy.emailTitle}</Heading>
				<Text my="3" color={muted}>{copy.emailHelp}</Text>
				<Text fontSize="sm" color={muted}>{copy.current}</Text>
				<Text fontWeight="700" mb="5" wordBreak="break-word">{currentEmail}</Text>
				<form onSubmit={updateEmail}>
					<VStack align="stretch" spacing="4">
						<FormControl isRequired>
							<FormLabel>{copy.newEmail}</FormLabel>
							<Input type="email" value={email} onChange={(event) => setEmail(event.target.value)}
								variant="filled" autoComplete="email" required />
						</FormControl>
						<FormControl isRequired>
							<FormLabel>{copy.password}</FormLabel>
							<Input type="password" value={password} onChange={(event) => setPassword(event.target.value)}
								variant="filled" autoComplete="current-password" required />
						</FormControl>
						<Button type="submit" colorScheme="teal" isLoading={busy} isDisabled={!email.trim() || !password}>
							{copy.update}
						</Button>
					</VStack>
				</form>
			</Box>

			<Box bg={dangerBg} border="1px solid" borderColor={dangerBorder} borderRadius="2xl" p="6">
				<Heading fontSize="xl" color={dangerHeading}>{copy.delete}</Heading>
				<Text my="3" color={muted}>{copy.deleteHelp}</Text>
				<Button colorScheme="red" variant="outline" leftIcon={<DeleteIcon />} onClick={onOpen}>{copy.deleteButton}</Button>
			</Box>

			<AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={closeDialog}>
				<AlertDialogOverlay>
					<AlertDialogContent mx="4">
						<AlertDialogHeader>{copy.dialog}</AlertDialogHeader>
						<AlertDialogBody>
							<Text mb="4">{copy.confirmText}</Text>
							<FormControl mb="4" isRequired>
								<FormLabel>{copy.password}</FormLabel>
								<Input type="password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} />
							</FormControl>
							<FormControl isRequired>
								<FormLabel>DELETE MY ACCOUNT</FormLabel>
								<Input value={phrase} onChange={(event) => setPhrase(event.target.value)} />
							</FormControl>
						</AlertDialogBody>
						<AlertDialogFooter gap="3">
							<Button ref={cancelRef} onClick={closeDialog}>{copy.keep}</Button>
							<Button colorScheme="red" isLoading={busy}
								isDisabled={!deletePassword || phrase !== "DELETE MY ACCOUNT"} onClick={deleteAccount}>
								{copy.confirm}
							</Button>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialogOverlay>
			</AlertDialog>
		</VStack>
	);
};
