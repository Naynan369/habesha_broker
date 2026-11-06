import { CheckCircleIcon, EmailIcon } from "@chakra-ui/icons";
import {
	Box,
	Button,
	Flex,
	Heading,
	HStack,
	PinInput,
	PinInputField,
	Text,
	useToast,
	VStack,
	useColorModeValue,
} from "@chakra-ui/react";
import axios from "axios";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import { withSessionSsr } from "@config/cookie/cookie";
import { ColorModeToggle } from "@components/shared/ColorModeToggle";
import { useLang } from "@libs/hooks/useLang";

export const getServerSideProps = withSessionSsr(async ({ req, locale }) => {
	const user = req.user;
	if (!user) return { redirect: { destination: locale === "am" ? "/am/auth/login" : "/auth/login" }, props: {} };
	if (user.verfied) return { redirect: { destination: locale === "am" ? "/am/dashboard" : "/dashboard" }, props: {} };
	return { props: { user } };
});

export default function VerifyAccountPage({ user }) {
	const [value, setValue] = useState("");
	const [sent, setSent] = useState(false);
	const [sending, setSending] = useState(false);
	const [verifying, setVerifying] = useState(false);
	const text = useLang().verificationPage;

	const toast = useToast();
	const router = useRouter();
	const pageBg = useColorModeValue("gray.50", "#000000");
	const surface = useColorModeValue("white", "#0c0c0c");
	const textColor = useColorModeValue("maingray", "gray.100");
	const cardBorder = useColorModeValue("gray.200", "whiteAlpha.200");

	const sendEmail = async () => {
		setSending(true);

		await axios
			.post("/api/user/requestVerification", {})
			.then((res) => {
				if (res.data?.alreadyVerified) {
					toast({ title: text.alreadyVerified, status: "info", isClosable: true });
					router.replace("/dashboard");
					return;
				}
				if (res.data?.deliveryAccepted !== true) throw new Error("Mail provider did not confirm acceptance");
				setSent(true);
				toast({ title: text.emailAccepted, status: "success", isClosable: true });
			})
			.catch(() => {
				toast({
					title: text.emailError,
					status: "error",
					isClosable: true,
				});
			})
			.finally(() => {
				setSending(false);
			});
	};

	const verifyEmail = async () => {
		setVerifying(true);
		await axios
			.post("/api/user/verifyAccount", {
				code: value,
			})
			.then(() => {
				router.replace("/dashboard");
			})
			.catch(() => {
				toast({
					title: text.verifyError,
					isClosable: true,
					status: "error",
				});
			})
			.finally(() => {
				setVerifying(false);
			});
	};

	return (
		<>
			<Head>
				<title>{text.pageTitle}</title>
			</Head>
			<Flex
				minH="100dvh"
				position="relative"
				direction="column"
				justifyContent="center"
				alignItems={"center"}
				background={pageBg}
				color={textColor}
			>
				<Box position="absolute" top="5" right="5"><ColorModeToggle /></Box>
				<Flex
					background={surface}
					p={{ base: 6, md: 10 }}
					borderRadius="2xl"
					border="1px solid"
					borderColor={cardBorder}
					boxShadow="0 18px 48px rgba(8,24,30,.14)"
					direction="column"
					alignItems="center"
				>
					<Heading mb="5">{text.heading}</Heading>
					<Text>
						{text.instructions}{" "}
						<Text as="span" color="blue.500">{user.email}</Text>.
					</Text>
					{sent ? (
						<>
							<HStack my="6">
								<PinInput
									value={value}
									onChange={(e) => setValue(e)}
									placeholder="-"
									variant="filled"
								>
									<PinInputField />
									<PinInputField />
									<PinInputField />
									<PinInputField />
									<PinInputField />
									<PinInputField />
								</PinInput>
							</HStack>
							<VStack w={"full"} mt="5">
								<Button
									isLoading={verifying}
								loadingText={text.verifying}
									w="full"
									colorScheme="blue"
									leftIcon={<CheckCircleIcon />}
									onClick={verifyEmail}
								>
									{text.verify}
								</Button>
								<Button
									disabled={verifying}
									w="full"
									colorScheme="blue"
									variant={"ghost"}
									onClick={() => router.back()}
								>
									{text.cancel}
								</Button>
							</VStack>
						</>
					) : (
						<Button
							isLoading={sending}
							loadingText={text.sending}
							leftIcon={<EmailIcon />}
							w={"full"}
							colorScheme="blue"
							onClick={sendEmail}
						>
							{text.sendCode}
						</Button>
					)}
				</Flex>
			</Flex>
		</>
	);
}
