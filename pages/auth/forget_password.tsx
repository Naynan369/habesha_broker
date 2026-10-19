import { ArrowBackIcon } from "@chakra-ui/icons";
import {
	Box,
	Button,
	Flex,
	FormControl,
	FormErrorMessage,
	FormLabel,
	Heading,
	Input,
	Link,
	Text,
	useToast,
	VStack,
	useColorModeValue,
} from "@chakra-ui/react";
import { ColorModeToggle } from "@components/shared/ColorModeToggle";
import axios from "axios";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import { MdRotateLeft } from "react-icons/md";

export default function ForgetPassword() {
	const [email, setEmail] = useState("");
	const [sending, setSending] = useState(false);
	const [sent, setSent] = useState(false);
	const [err, setErr] = useState("");

	const router = useRouter();
	const toast = useToast();
	const canvas = useColorModeValue("#f5f5f1", "#000000");
	const surface = useColorModeValue("white", "#111111");
	const textColor = useColorModeValue("#143A45", "#e7eff0");
	const fieldBg = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");

	const requestLink = async () => {
		setSending(true);
		await axios
			.post("/api/user/forgotPassword/requestLink", {
				email,
			})
			.then((res) => {
				setSent(true);
			})
			.catch((error) => {
				const e = error.response.data;
				if (e?.email) {
					setErr(e.err);
				} else {
					toast({
						title: "Error, Sending link",
						description: "Please try again",
						isClosable: true,
						status: "error",
					});
				}
			})
			.finally(() => {
				setSending(false);
			});
	};

	return (
		<>
			<Head>
				<title>Forget Password</title>
			</Head>
			<Flex
				direction="column"
				alignItems="center"
				justifyContent="center"
				background={canvas}
				minH="100vh"
				px={{ base: 4, sm: 6 }}
				py={{ base: 20, md: 10 }}
				position="relative"
			>
				<Box position="absolute" top="5" right={{ base: 4, sm: 6 }}><ColorModeToggle /></Box>
				<Flex
					w="full"
					maxW="lg"
					p={{ base: 5, sm: 8, md: 10 }}
					borderRadius="2xl"
					boxShadow="2xl"
					background={surface}
					color={textColor}
					border="1px solid"
					borderColor={borderColor}
					direction="column"
				>
					<Heading fontSize={{ base: "2xl", sm: "3xl" }}>Forget Password 🤷‍♂️</Heading>
					{sent ? (
						<Flex mt="5" direction="column">
							<Text>
								Link that use to reset your password have been
								sent through your email, <br /> check your email{" "}
								<Link
									color={"blue.600"}
									href={`mailto:${email}`}
								>
									{email}
								</Link>
							</Text>
							<Button
								mt="10"
								colorScheme="red"
								leftIcon={<ArrowBackIcon />}
								onClick={() => router.back()}
							>
								Go Back
							</Button>
						</Flex>
					) : (
						<Flex direction={"column"}>
							<Text my="5">
								Request password resting link through your
								email.
							</Text>

							<FormControl
								isDisabled={sending}
								isInvalid={!!err}
								my="5"
							>
								<FormLabel>Email</FormLabel>
								<Input
									bg={fieldBg}
									color={textColor}
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									type="email"
									name="email"
									autoComplete="email"
									variant="flushed"
									placeholder="Enter your email here"
								/>

								<FormErrorMessage>{err}</FormErrorMessage>
							</FormControl>
							<VStack mt="5">
								<Button
									w="full"
									isLoading={sending}
									leftIcon={<MdRotateLeft />}
									colorScheme={"red"}
									onClick={requestLink}
								>
									Reset Password
								</Button>
								<Button
									isDisabled={sending}
									w="full"
									variant={"ghost"}
									colorScheme="red"
									onClick={() => router.back()}
								>
									Cancel
								</Button>
							</VStack>
						</Flex>
					)}
				</Flex>
			</Flex>
		</>
	);
}
