import {
	Button,
	Flex,
	FormControl,
	FormLabel,
	Heading,
	Input,
	Text,
	useToast,
} from "@chakra-ui/react";
import axios from "axios";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";

export default function ResetPasswordPage() {
	const router = useRouter();
	const toast = useToast();
	const token = typeof router.query.token === "string" ? router.query.token : "";
	const [password, setPassword] = useState("");
	const [confirmation, setConfirmation] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [complete, setComplete] = useState(false);

	const submit = async (event) => {
		event.preventDefault();
		if (!token) {
			toast({ title: "This reset link is invalid", status: "error" });
			return;
		}
		if (password.length < 8 || password.length > 128 || password !== confirmation) {
			toast({ title: "Check your password fields", description: "Use at least 8 characters and make both entries match.", status: "error" });
			return;
		}
		setSubmitting(true);
		try {
			await axios.post("/api/user/forgotPassword/reset", { token, password, confirmation });
			setComplete(true);
		} catch (_err) {
			toast({ title: "Unable to reset password", description: "The link may have expired. Request a new one and try again.", status: "error" });
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<>
			<Head><title>Reset Password - Habesha Brokers</title></Head>
			<Flex minH="100vh" align="center" justify="center" bg="red.50" px="5">
				<Flex as="section" bg="white" p="10" borderRadius="2xl" boxShadow="2xl" direction="column" w="full" maxW="xl">
					<Heading mb="5">Reset your password</Heading>
					{complete ? (
						<>
							<Text mb="6">Your password has been updated. You can now sign in with it.</Text>
							<Button onClick={() => router.replace("/auth/login")} colorScheme="red">Go to sign in</Button>
						</>
					) : (
						<form onSubmit={submit}>
							<FormControl mb="5" isDisabled={submitting}>
								<FormLabel>New password</FormLabel>
								<Input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
							</FormControl>
							<FormControl mb="6" isDisabled={submitting}>
								<FormLabel>Confirm new password</FormLabel>
								<Input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
							</FormControl>
							<Button w="full" type="submit" colorScheme="red" isLoading={submitting}>Update password</Button>
							<Text mt="4" fontSize="sm" color="gray.600">Reset links expire after one hour.</Text>
						</form>
					)}
				</Flex>
			</Flex>
		</>
	);
}

