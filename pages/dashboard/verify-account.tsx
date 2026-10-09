import { CheckCircleIcon, EmailIcon } from "@chakra-ui/icons";
import {
	Button,
	Flex,
	Heading,
	HStack,
	PinInput,
	PinInputField,
	Text,
	useToast,
	VStack,
} from "@chakra-ui/react";
import axios from "axios";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import { withSessionSsr } from "@config/cookie/cookie";

export const getServerSideProps = withSessionSsr(async ({ req }) => {
	const user = req.session.user;
	if (!user) return { redirect: { destination: "/auth/login" }, props: {} };
	if (user.verfied) return { redirect: { destination: "/dashboard" }, props: {} };
	return { props: { user } };
});

export default function VerifyAccountPage({ user }) {
	const [value, setValue] = useState("");
	const [sent, setSent] = useState(false);
	const [sending, setSending] = useState(false);
	const [verifying, setVerifying] = useState(false);
	const [verified, setVerified] = useState(false);

	const toast = useToast();
	const router = useRouter();

	const sendEmail = async () => {
		setSending(true);

		await axios
			.post("/api/user/requestVerification", {})
			.then((res) => {
				setSent(true);
			})
			.catch((err) => {
				toast({
					title: "Error Sending An Email",
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
			.then((res) => {
				router.replace("/dashboard");
				setVerified(true);
			})
			.catch((err) => {
				toast({
					title: "Error Verifying Account, try again",
					isClosable: true,
					status: "error",
				});
				setSent(false);
			})
			.finally(() => {
				setVerifying(false);
			});
	};

	return (
		<>
			<Head>
				<title>Verify Account</title>
			</Head>
			<Flex
				h="100vh"
				direction="column"
				justifyContent="center"
				alignItems={"center"}
				background="blackAlpha.100"
				color={"maingray"}
			>
				<Flex
					background="white"
					p="10"
					borderRadius="2xl"
					boxShadow="2xl"
					direction="column"
					alignItems="center"
				>
					<Heading mb="5">Verify Your Email Address</Heading>
					<Text>
						We will send a Verification code through your email,{" "}
						<Text color="blue.500">{user.email}</Text>.
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
									w="full"
									colorScheme="blue"
									leftIcon={<CheckCircleIcon />}
									onClick={verifyEmail}
								>
									Verify Email
								</Button>
								<Button
									disabled={verifying}
									w="full"
									colorScheme="blue"
									variant={"ghost"}
									onClick={() => router.back()}
								>
									Cancel
								</Button>
							</VStack>
						</>
					) : (
						<Button
							isLoading={sending}
							leftIcon={<EmailIcon />}
							w={"full"}
							colorScheme="blue"
							onClick={sendEmail}
						>
							Send Verification Email
						</Button>
					)}
				</Flex>
			</Flex>
		</>
	);
}
