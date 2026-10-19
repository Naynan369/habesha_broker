import { Alert, AlertDescription, AlertIcon, Box, Button, Flex, Heading, Spinner, Text, useColorModeValue } from "@chakra-ui/react";
import axios from "axios";
import { useLang } from "@libs/hooks/useLang";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

type PaymentState = "checking" | "PAID" | "PENDING" | "FAILED" | "ERROR";

export default function StripeTestPaymentReturn() {
	const router = useRouter();
	const labels = useLang().payments;
	const pageBg = useColorModeValue("#f5f5f1", "#000000");
	const surface = useColorModeValue("white", "#0c0c0c");
	const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
	const [attempt, setAttempt] = useState(0);
	const [state, setState] = useState<PaymentState>("checking");
	const [itemId, setItemId] = useState("");
	const sessionId = typeof router.query.session_id === "string" ? router.query.session_id : "";
	const cancelled = router.query.cancelled === "1";
	const cancelledItemId = typeof router.query.itemId === "string" ? router.query.itemId : "";

	useEffect(() => {
		if (!router.isReady) return;
		if (cancelled) {
			setItemId(cancelledItemId);
			setState("FAILED");
			return;
		}
		if (!sessionId) {
			setState("ERROR");
			return;
		}
		let active = true;
		setState("checking");
		axios.get("/api/payments/stripe/verify", { params: { session_id: sessionId } })
			.then((response) => {
				if (!active) return;
				setState(response.data?.status === "PAID" ? "PAID" : response.data?.status === "FAILED" ? "FAILED" : "PENDING");
				if (typeof response.data?.itemId === "string") setItemId(response.data.itemId);
			})
			.catch(() => { if (active) setState("ERROR"); });
		return () => { active = false; };
	}, [router.isReady, sessionId, cancelled, cancelledItemId, attempt]);

	const title = state === "checking"
		? labels.checkTitle
		: state === "PAID"
			? labels.paidTitle
			: state === "FAILED" || state === "ERROR"
				? labels.failedTitle
				: labels.pendingTitle;
	const message = state === "PAID"
		? labels.paid
		: state === "FAILED" || state === "ERROR"
			? labels.failedBody
			: labels.pendingBody;

	return (
		<Flex minH="100dvh" align="center" justify="center" p="5" bg={pageBg}>
			<Box w="full" maxW="lg" bg={surface} border="1px solid" borderColor={borderColor} borderRadius="2xl" boxShadow="xl" p={{ base: 6, md: 8 }}>
				{state === "checking" ? (
					<Flex direction="column" align="center" gap="4" py="8"><Spinner size="xl" color="orange.400" /><Heading size="md">{title}</Heading></Flex>
				) : (
					<>
						<Heading size="lg">{title}</Heading>
						<Alert mt="5" status={state === "PAID" ? "success" : state === "PENDING" ? "warning" : "error"} borderRadius="xl">
							<AlertIcon /><AlertDescription>{message}</AlertDescription>
						</Alert>
						{state === "PENDING" && <Text mt="4" fontSize="sm" color="gray.500">{labels.pendingBody}</Text>}
						<Flex mt="6" gap="3" wrap="wrap">
							{state !== "PAID" && state !== "FAILED" && <Button variant="outline" onClick={() => setAttempt((value) => value + 1)}>{labels.retry}</Button>}
							{itemId && <Button colorScheme="orange" onClick={() => router.push("/dashboard/list-my-items", undefined, { locale: router.locale })}>{labels.returnToListing}</Button>}
						</Flex>
					</>
				)}
			</Box>
		</Flex>
	);
}
