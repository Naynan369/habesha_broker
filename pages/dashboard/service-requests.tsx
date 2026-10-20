import { Alert, AlertDescription, AlertIcon, AlertTitle, Avatar, Badge, Box, Button, Container, Flex, Heading, HStack, Image, Skeleton, SimpleGrid, Stack, Text, useColorModeValue, useToast } from "@chakra-ui/react";
import { BrandLogo } from "@components/shared/BrandLogo";
import { ColorModeToggle } from "@components/shared/ColorModeToggle";
import { withSessionSsr } from "@config/cookie/cookie";
import { useLang } from "@libs/hooks/useLang";
import axios from "axios";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { MdArrowBack, MdEventAvailable } from "react-icons/md";

export const getServerSideProps = withSessionSsr(async ({ req, locale }) => {
	if (!req.user) return { redirect: { destination: locale === "am" ? "/am/auth/login/" : "/auth/login/" }, props: {} };
	return { props: { user: req.user } };
});

export default function ServiceRequestsPage() {
	const text = useLang().serviceRequestsPage;
	const router = useRouter();
	const toast = useToast();
	const [view, setView] = useState<"received" | "sent">("received");
	const [requests, setRequests] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState(false);
	const [busyId, setBusyId] = useState("");
	const [page, setPage] = useState(0);
	const [total, setTotal] = useState(0);
	const pageBg = useColorModeValue("#f5f5f1", "#000000");
	const surface = useColorModeValue("white", "#0c0c0c");
	const border = useColorModeValue("gray.200", "whiteAlpha.200");
	const muted = useColorModeValue("gray.600", "gray.400");
	const navBg = useColorModeValue("maingray", "#050505");
	const emptyIconBg = useColorModeValue("orange.50", "whiteAlpha.100");
	const load = useCallback(async () => {
		setLoading(true); setLoadError(false);
		try {
			const response = await axios.get(`/api/serviceRequests?view=${view}&page=${page}`);
			setRequests(response.data.requests || []);
			setTotal(response.data.total || 0);
		} catch { setLoadError(true); }
		finally { setLoading(false); }
	}, [view, page]);
	useEffect(() => { void load(); }, [load]);

	const updateRequest = async (requestId: string, action: string) => {
		setBusyId(requestId);
		try {
			await axios.post("/api/serviceRequests/update", { requestId, action });
			toast({ title: text.updated, status: "success", duration: 3500, isClosable: true });
			await load();
		} catch (error: any) {
			toast({ title: text.updateFailed, description: error?.response?.data?.err || text.tryAgain, status: "error", duration: 5000, isClosable: true });
		} finally { setBusyId(""); }
	};
	const statusColor: Record<string, string> = { NEW: "blue", ACCEPTED: "green", DECLINED: "red", COMPLETED: "purple", CANCELLED: "gray" };
	const statusLabel: Record<string, string> = { NEW: text.statusNew, ACCEPTED: text.statusAccepted, DECLINED: text.statusDeclined, COMPLETED: text.statusCompleted, CANCELLED: text.statusCancelled };

	return <>
		<Head><title>{text.pageTitle}</title></Head>
		<Flex minH="100dvh" direction="column" bg={pageBg}>
			<Flex align="center" minH="72px" px={{ base: 4, md: 8 }} bg={navBg} color="white" gap="4">
				<Button variant="ghost" color="white" leftIcon={<MdArrowBack />} onClick={() => router.push("/dashboard")}>{text.back}</Button>
				<Box flex="1"><BrandLogo compact /></Box><ColorModeToggle />
			</Flex>
			<Container maxW="6xl" py={{ base: 8, md: 12 }} px={{ base: 4, md: 8 }} flex="1">
				<Flex justify="space-between" align={{ base: "flex-start", md: "center" }} direction={{ base: "column", md: "row" }} gap="5" mb="7">
					<Box><Text color="mainorange" fontSize="xs" fontWeight="bold" letterSpacing=".14em" textTransform="uppercase">{text.workspace}</Text><Heading mt="2" fontSize={{ base: "2xl", md: "4xl" }}>{text.heading}</Heading><Text mt="3" color={muted} maxW="2xl">{text.description}</Text></Box>
					<HStack p="1" border="1px solid" borderColor={border} borderRadius="xl" bg={surface}>
						<Button variant={view === "received" ? "solid" : "ghost"} colorScheme={view === "received" ? "orange" : undefined} onClick={() => { setPage(0); setView("received"); }}>{text.received}</Button>
						<Button variant={view === "sent" ? "solid" : "ghost"} colorScheme={view === "sent" ? "orange" : undefined} onClick={() => { setPage(0); setView("sent"); }}>{text.sent}</Button>
					</HStack>
				</Flex>
				{loadError && <Alert status="error" borderRadius="xl" mb="5"><AlertIcon /><Box><AlertTitle>{text.loadFailed}</AlertTitle><AlertDescription>{text.tryAgain}</AlertDescription></Box><Button ml="auto" size="sm" onClick={() => void load()}>{text.retry}</Button></Alert>}
				{loading ? <Stack spacing="4">{[1, 2, 3].map((key) => <Skeleton key={key} h="190px" borderRadius="2xl" />)}</Stack> : !loadError && requests.length === 0 ? (
					<Flex direction="column" align="center" textAlign="center" py={{ base: 14, md: 20 }} px="5" bg={surface} border="1px solid" borderColor={border} borderRadius="3xl"><Flex w="14" h="14" borderRadius="2xl" bg={emptyIconBg} color="mainorange" align="center" justify="center"><MdEventAvailable size="25" /></Flex><Heading mt="5" size="md">{view === "received" ? text.emptyReceivedTitle : text.emptySentTitle}</Heading><Text mt="2" color={muted} maxW="md">{view === "received" ? text.emptyReceivedBody : text.emptySentBody}</Text>{view === "sent" && <Button mt="5" colorScheme="orange" onClick={() => void router.push("/explore?itemType=SERVICE")}>{text.exploreServices}</Button>}</Flex>
				) : (
					<SimpleGrid columns={{ base: 1, lg: 2 }} spacing="5">
						{requests.map((request) => {
							const person = view === "received" ? request.customer : request.provider;
							return <Box key={request.id} p={{ base: 4, md: 5 }} bg={surface} border="1px solid" borderColor={border} borderRadius="2xl" boxShadow="0 8px 28px rgba(10,20,30,.05)">
								<Flex align="flex-start" gap="4">
									{request.item.images?.[0] ? <Image src={request.item.images[0]} alt={request.item.title} boxSize="76px" objectFit="cover" borderRadius="xl" flexShrink={0} /> : <Avatar name={request.item.title} size="lg" borderRadius="xl" />}
									<Box minW="0" flex="1"><Link legacyBehavior href={`/items/${request.item.id}`} passHref><Heading as="a" size="sm" noOfLines={2} _hover={{ color: "mainorange" }}>{request.item.title}</Heading></Link><Text mt="1" fontSize="sm" color={muted}>{view === "received" ? text.from : text.providerLabel} {person.firstName} {person.lastName}</Text><Badge mt="2" colorScheme={statusColor[request.status]}>{statusLabel[request.status] || request.status}</Badge></Box>
								</Flex>
								<Text mt="4" whiteSpace="pre-wrap" wordBreak="break-word">{request.message}</Text>
								{request.preferredAt && <Text mt="3" fontSize="sm" color={muted}><strong>{text.preferredDate}:</strong> {new Date(request.preferredAt).toLocaleDateString(router.locale === "am" ? "am-ET" : "en-ET", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })}</Text>}
								{view === "received" && <Stack mt="3" spacing="1" fontSize="sm" color={muted}><Text>{person.email}</Text>{request.contactPhone && <Text>{text.customerPhone}: {request.contactPhone}</Text>}</Stack>}
								<Text mt="3" fontSize="xs" color={muted}>{text.requestedOn} {new Date(request.createdAt).toLocaleDateString(router.locale === "am" ? "am-ET" : "en-ET", { year: "numeric", month: "short", day: "numeric" })}</Text>
								{view === "received" && <Flex mt="5" gap="3" wrap="wrap">
									{request.status === "NEW" && <><Button size="sm" colorScheme="green" isLoading={busyId === request.id} isDisabled={Boolean(busyId && busyId !== request.id)} onClick={() => void updateRequest(request.id, "accept")}>{text.accept}</Button><Button size="sm" variant="outline" colorScheme="red" isDisabled={Boolean(busyId)} onClick={() => void updateRequest(request.id, "decline")}>{text.decline}</Button></>}
									{request.status === "ACCEPTED" && <Button size="sm" colorScheme="purple" isLoading={busyId === request.id} onClick={() => void updateRequest(request.id, "complete")}>{text.markCompleted}</Button>}
								</Flex>}
								{view === "sent" && request.status === "NEW" && <Button mt="5" size="sm" variant="outline" isLoading={busyId === request.id} onClick={() => void updateRequest(request.id, "cancel")}>{text.cancelRequest}</Button>}
							</Box>;
						})}
					</SimpleGrid>
				)}
				{!loading && !loadError && total > 20 && <Flex mt="6" justify="center" align="center" gap="4">
					<Button size="sm" variant="outline" isDisabled={page === 0} onClick={() => setPage((current) => current - 1)}>{text.previous}</Button>
					<Text fontSize="sm" color={muted}>{page + 1} / {Math.ceil(total / 20)}</Text>
					<Button size="sm" variant="outline" isDisabled={(page + 1) * 20 >= total} onClick={() => setPage((current) => current + 1)}>{text.next}</Button>
				</Flex>}
			</Container>
		</Flex>
	</>;
}
