import { Alert, AlertDescription, AlertIcon, AlertTitle, Avatar, Badge, Box, Button, Container, Flex, FormControl, FormLabel, Heading, Image, Input, Select, Skeleton, SimpleGrid, Stack, Text, Textarea, useColorModeValue, useToast } from "@chakra-ui/react";
import { BrandLogo } from "@components/shared/BrandLogo";
import { ColorModeToggle } from "@components/shared/ColorModeToggle";
import { ListingImage } from "@components/shared/ListingImage";
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

export default function ServiceRequestsPage({ user }: { user: { id: string } }) {
	const lang = useLang();
	const text = lang.serviceRequestsPage;
	const listingText = lang.listingManagementPage;
	const serviceText = lang.serviceListing;
	const router = useRouter();
	const toast = useToast();
	const [view, setView] = useState<"services" | "received" | "sent">("services");
	const [requests, setRequests] = useState<any[]>([]);
	const [serviceListings, setServiceListings] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState(false);
	const [busyId, setBusyId] = useState("");
	const [quoteAmounts, setQuoteAmounts] = useState<Record<string, string>>({});
	const [quoteNotes, setQuoteNotes] = useState<Record<string, string>>({});
	const [appointmentDrafts, setAppointmentDrafts] = useState<Record<string, string>>({});
	const [reviewRatings, setReviewRatings] = useState<Record<string, string>>({});
	const [reviewComments, setReviewComments] = useState<Record<string, string>>({});
	const [page, setPage] = useState(0);
	const [total, setTotal] = useState(0);
	const pageBg = useColorModeValue("#f5f5f1", "#000000");
	const surface = useColorModeValue("white", "#0c0c0c");
	const border = useColorModeValue("gray.200", "whiteAlpha.200");
	const muted = useColorModeValue("gray.600", "gray.400");
	const linkHoverColor = useColorModeValue("#8d421e", "#f0b783");
	const navBg = useColorModeValue("maingray", "#050505");
	const emptyIconBg = useColorModeValue("orange.50", "whiteAlpha.100");
	const quoteSurface = useColorModeValue("orange.50", "whiteAlpha.100");
	const load = useCallback(async () => {
		setLoading(true); setLoadError(false);
		try {
			if (view === "services") {
				const response = await axios.post(`/api/items?page=${page}`, { userId: user.id, itemType: "SERVICE" });
				setServiceListings(response.data.items || []);
				setRequests([]);
				setTotal(response.data.total || 0);
			} else {
				const response = await axios.get(`/api/serviceRequests?view=${view}&page=${page}`);
				setRequests(response.data.requests || []);
				setServiceListings([]);
				setTotal(response.data.total || 0);
			}
		} catch { setRequests([]); setServiceListings([]); setTotal(0); setLoadError(true); }
		finally { setLoading(false); }
	}, [view, page, user.id]);
	useEffect(() => { void load(); }, [load]);

	const updateRequest = async (requestId: string, action: string, extra: Record<string, unknown> = {}) => {
		setBusyId(requestId);
		try {
			await axios.post("/api/serviceRequests/update", { requestId, action, ...extra });
			toast({ title: text.updated, status: "success", duration: 3500, isClosable: true });
			await load();
		} catch (error: any) {
			toast({ title: text.updateFailed, description: error?.response?.data?.err || text.tryAgain, status: "error", duration: 5000, isClosable: true });
		} finally { setBusyId(""); }
	};
	const sendQuote = async (requestId: string) => {
		const amount = Number(quoteAmounts[requestId]);
		if (!Number.isFinite(amount) || amount <= 0) {
			toast({ title: text.quoteRequired, status: "warning", duration: 3500, isClosable: true });
			return;
		}
		const localAppointment = appointmentDrafts[requestId];
		await updateRequest(requestId, "quote", {
			quoteAmount: amount,
			quoteNote: quoteNotes[requestId] || "",
			appointmentAt: localAppointment ? new Date(localAppointment).toISOString() : undefined,
		});
	};
	const scheduleAppointment = async (requestId: string) => {
		const localAppointment = appointmentDrafts[requestId];
		if (!localAppointment) return;
		await updateRequest(requestId, "schedule", { appointmentAt: new Date(localAppointment).toISOString() });
	};
	const submitReview = async (requestId: string) => {
		setBusyId(requestId);
		try {
			await axios.post("/api/serviceRequests/review", { requestId, rating: Number(reviewRatings[requestId] || 5), comment: reviewComments[requestId] || "" });
			toast({ title: text.reviewed, status: "success", duration: 3500, isClosable: true });
			await load();
		} catch (error: any) {
			toast({ title: text.reviewFailed, description: error?.response?.data?.err || text.tryAgain, status: "error", duration: 5000, isClosable: true });
		} finally { setBusyId(""); }
	};
	const statusColor: Record<string, string> = { NEW: "blue", QUOTED: "orange", ACCEPTED: "green", SCHEDULED: "teal", DECLINED: "red", COMPLETED: "purple", CANCELLED: "gray" };
	const statusLabel: Record<string, string> = { NEW: text.statusNew, QUOTED: text.statusQuoted, ACCEPTED: text.statusAccepted, SCHEDULED: text.statusScheduled, DECLINED: text.statusDeclined, COMPLETED: text.statusCompleted, CANCELLED: text.statusCancelled };
	const listingStatus: Record<string, { label: string; color: string }> = {
		PENDING: { label: listingText.pending, color: "yellow" },
		DECLINED: { label: listingText.declined, color: "red" },
		SOLD: { label: listingText.sold, color: "gray" },
		CLOSED: { label: listingText.closed, color: "gray" },
	};
	const pageSize = view === "services" ? 30 : 20;
	const empty = view === "services" ? serviceListings.length === 0 : requests.length === 0;

	return <>
		<Head><title>{text.pageTitle}</title></Head>
		<Flex minH="100dvh" direction="column" bg={pageBg}>
			<Flex align="center" minH="72px" px={{ base: 4, md: 8 }} bg={navBg} color="white" gap="4">
				<Button variant="ghost" color="white" leftIcon={<MdArrowBack />} _hover={{ bg: "whiteAlpha.200", color: "white" }} _active={{ bg: "whiteAlpha.300", color: "white" }} onClick={() => router.push("/dashboard")}>{text.back}</Button>
				<Box flex="1"><BrandLogo compact /></Box><ColorModeToggle />
			</Flex>
			<Container maxW="6xl" py={{ base: 8, md: 12 }} px={{ base: 4, md: 8 }} flex="1">
				<Flex justify="space-between" align={{ base: "flex-start", lg: "center" }} direction={{ base: "column", lg: "row" }} gap="5" mb="7">
					<Box minW="0" flex="1"><Text color="mainorange" fontSize="xs" fontWeight="bold" letterSpacing=".14em" textTransform="uppercase">{text.workspace}</Text><Heading mt="2" fontSize={{ base: "2xl", md: "4xl" }}>{text.heading}</Heading><Text mt="3" color={muted} maxW="2xl">{text.description}</Text></Box>
					<SimpleGrid w={{ base: "full", lg: "auto" }} minW={{ lg: "520px" }} columns={{ base: 1, sm: 3 }} spacing="2" p="1" border="1px solid" borderColor={border} borderRadius="xl" bg={surface}>
						<Button variant={view === "services" ? "solid" : "ghost"} colorScheme={view === "services" ? "orange" : undefined} onClick={() => { setPage(0); setView("services"); }}>{text.myServices}</Button>
						<Button variant={view === "received" ? "solid" : "ghost"} colorScheme={view === "received" ? "orange" : undefined} onClick={() => { setPage(0); setView("received"); }}>{text.received}</Button>
						<Button variant={view === "sent" ? "solid" : "ghost"} colorScheme={view === "sent" ? "orange" : undefined} onClick={() => { setPage(0); setView("sent"); }}>{text.sent}</Button>
					</SimpleGrid>
				</Flex>
				{loadError && <Alert status="error" borderRadius="xl" mb="5"><AlertIcon /><Box><AlertTitle>{text.loadFailed}</AlertTitle><AlertDescription>{text.tryAgain}</AlertDescription></Box><Button ml="auto" size="sm" onClick={() => void load()}>{text.retry}</Button></Alert>}
				{loading ? <Stack spacing="4">{[1, 2, 3].map((key) => <Skeleton key={key} h="190px" borderRadius="2xl" />)}</Stack> : !loadError && empty ? (
					<Flex direction="column" align="center" textAlign="center" py={{ base: 14, md: 20 }} px="5" bg={surface} border="1px solid" borderColor={border} borderRadius="3xl"><Flex w="14" h="14" borderRadius="2xl" bg={emptyIconBg} color="mainorange" align="center" justify="center"><MdEventAvailable size="25" /></Flex><Heading mt="5" size="md">{view === "services" ? text.emptyServicesTitle : view === "received" ? text.emptyReceivedTitle : text.emptySentTitle}</Heading><Text mt="2" color={muted} maxW="md">{view === "services" ? text.emptyServicesBody : view === "received" ? text.emptyReceivedBody : text.emptySentBody}</Text>{view === "services" && <Button mt="5" colorScheme="orange" onClick={() => void router.push("/dashboard/add-item")}>{text.createService}</Button>}{view === "sent" && <Button mt="5" colorScheme="orange" onClick={() => void router.push("/explore?itemType=SERVICE")}>{text.exploreServices}</Button>}</Flex>
				) : (
					<SimpleGrid columns={{ base: 1, lg: 2 }} spacing="5">
						{view === "services" ? serviceListings.map((listing) => {
							const status = listingStatus[listing.status] || { label: listing.status, color: "gray" };
							const service = listing.Service;
							const category = service?.category ? serviceText.categories[service.category] || text.unknownCategory : text.unknownCategory;
							const location = [service?.city, service?.region].filter(Boolean).join(", ");
							return <Box key={listing.id} overflow="hidden" bg={surface} border="1px solid" borderColor={border} borderRadius="2xl" boxShadow="0 8px 28px rgba(10,20,30,.05)">
								<Box position="relative" h="180px"><ListingImage src={listing.images?.[0]} alt={listing.title} itemType="SERVICE" />{listing.status !== "APPROVED" && <Badge position="absolute" top="3" left="3" colorScheme={status.color} borderRadius="full" px="3" py="1">{status.label}</Badge>}</Box>
								<Stack p={{ base: 4, md: 5 }} spacing="3"><Box><Text color="mainorange" fontSize="xs" fontWeight="bold" letterSpacing=".08em" textTransform="uppercase">{category}</Text><Heading mt="1" size="sm" noOfLines={2}>{listing.title}</Heading></Box>
									{location && <Text color={muted} fontSize="sm">{location}</Text>}
									{service?.serviceArea && <Text color={muted} fontSize="sm" noOfLines={2}>{text.areasServed}: {service.serviceArea}</Text>}
									{service?.availability && <Text color={muted} fontSize="sm" noOfLines={2}>{serviceText.availability}: {service.availability}</Text>}
									{listing.status === "PENDING" && listing.paymentStatus !== "PAID" && <Badge alignSelf="flex-start" colorScheme="orange">{listing.paymentStatus === "PROCESSING" ? listingText.paymentProcessing : listingText.paymentDue}</Badge>}
									<Flex gap="3" wrap="wrap" pt="1"><Button as={Link} href={`/items/edit/${listing.id}`} size="sm" variant="outline" borderRadius="lg">{text.editService}</Button>{listing.status === "APPROVED" && <Button as={Link} href={`/items/${listing.id}`} size="sm" colorScheme="orange" borderRadius="lg">{text.viewService}</Button>}</Flex>
								</Stack>
							</Box>;
						}) : requests.map((request) => {
							const person = view === "received" ? request.customer : request.provider;
							return <Box key={request.id} p={{ base: 4, md: 5 }} bg={surface} border="1px solid" borderColor={border} borderRadius="2xl" boxShadow="0 8px 28px rgba(10,20,30,.05)">
								<Flex align="flex-start" gap="4">
									{request.item.images?.[0] ? <Image src={request.item.images[0]} alt={request.item.title} boxSize="76px" objectFit="cover" borderRadius="xl" flexShrink={0} /> : <Avatar name={request.item.title} size="lg" borderRadius="xl" />}
									<Box minW="0" flex="1"><Link legacyBehavior href={`/items/${request.item.id}`} passHref><Heading as="a" size="sm" noOfLines={2} _hover={{ color: linkHoverColor }}>{request.item.title}</Heading></Link><Text mt="1" fontSize="sm" color={muted}>{view === "received" ? text.from : text.providerLabel} {person.firstName} {person.lastName}</Text><Badge mt="2" colorScheme={statusColor[request.status]}>{statusLabel[request.status] || request.status}</Badge></Box>
								</Flex>
								<Text mt="4" whiteSpace="pre-wrap" wordBreak="break-word">{request.message}</Text>
								{request.preferredAt && <Text mt="3" fontSize="sm" color={muted}><strong>{text.preferredDate}:</strong> {new Date(request.preferredAt).toLocaleDateString(router.locale === "am" ? "am-ET" : "en-ET", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })}</Text>}
								{request.quoteAmount != null && <Box mt="4" p="4" bg={quoteSurface} border="1px solid" borderColor={border} borderRadius="xl"><Text fontWeight="bold">{text.quoteAmount}: ETB {Number(request.quoteAmount).toLocaleString(router.locale === "am" ? "am-ET" : "en-ET")}</Text>{request.quoteNote && <Text mt="2" whiteSpace="pre-wrap" color={muted}>{request.quoteNote}</Text>}<Text mt="2" fontSize="xs" color={muted}>{text.quoteDisclosure}</Text></Box>}
								{request.appointmentAt && <Text mt="3" fontSize="sm" color={muted}><strong>{text.appointment}:</strong> {new Date(request.appointmentAt).toLocaleString(router.locale === "am" ? "am-ET" : "en-ET", { dateStyle: "medium", timeStyle: "short" })}</Text>}
								{view === "received" && <Stack mt="3" spacing="1" fontSize="sm" color={muted}><Text>{person.email}</Text>{request.contactPhone && <Text>{text.customerPhone}: {request.contactPhone}</Text>}</Stack>}
								<Text mt="3" fontSize="xs" color={muted}>{text.requestedOn} {new Date(request.createdAt).toLocaleDateString(router.locale === "am" ? "am-ET" : "en-ET", { year: "numeric", month: "short", day: "numeric" })}</Text>
								{view === "received" && request.status === "NEW" && <Stack mt="5" p="4" bg={pageBg} border="1px solid" borderColor={border} borderRadius="xl" spacing="3">
									<Text fontSize="sm" color={muted}>{text.quoteDisclosure}</Text>
									<FormControl><FormLabel>{text.quoteAmount}</FormLabel><Input type="number" min="1" value={quoteAmounts[request.id] || ""} onChange={(event) => setQuoteAmounts((current) => ({ ...current, [request.id]: event.target.value }))} placeholder="ETB" /></FormControl>
									<FormControl><FormLabel>{text.quoteNote}</FormLabel><Textarea value={quoteNotes[request.id] || ""} onChange={(event) => setQuoteNotes((current) => ({ ...current, [request.id]: event.target.value }))} maxLength={1000} placeholder={text.quoteNotePlaceholder} /></FormControl>
									<FormControl><FormLabel>{text.proposedAppointment}</FormLabel><Input type="datetime-local" min={new Date().toISOString().slice(0, 16)} value={appointmentDrafts[request.id] || ""} onChange={(event) => setAppointmentDrafts((current) => ({ ...current, [request.id]: event.target.value }))} /></FormControl>
									<Flex gap="3" wrap="wrap"><Button size="sm" colorScheme="orange" isLoading={busyId === request.id} isDisabled={Boolean(busyId)} onClick={() => void sendQuote(request.id)}>{text.sendQuote}</Button><Button size="sm" colorScheme="green" isDisabled={Boolean(busyId)} onClick={() => void updateRequest(request.id, "accept")}>{text.accept}</Button><Button size="sm" variant="outline" colorScheme="red" isDisabled={Boolean(busyId)} onClick={() => void updateRequest(request.id, "decline")}>{text.decline}</Button></Flex>
								</Stack>}
								{view === "received" && request.status === "ACCEPTED" && <Stack mt="5" p="4" bg={pageBg} border="1px solid" borderColor={border} borderRadius="xl"><FormControl><FormLabel>{text.appointment}</FormLabel><Input type="datetime-local" min={new Date().toISOString().slice(0, 16)} value={appointmentDrafts[request.id] || ""} onChange={(event) => setAppointmentDrafts((current) => ({ ...current, [request.id]: event.target.value }))} /></FormControl><Flex gap="3" wrap="wrap"><Button size="sm" colorScheme="teal" isDisabled={!appointmentDrafts[request.id] || Boolean(busyId)} isLoading={busyId === request.id} onClick={() => void scheduleAppointment(request.id)}>{text.scheduleAppointment}</Button><Button size="sm" colorScheme="purple" isDisabled={Boolean(busyId)} onClick={() => void updateRequest(request.id, "complete")}>{text.markCompleted}</Button></Flex></Stack>}
								{view === "received" && request.status === "SCHEDULED" && <Button mt="5" size="sm" colorScheme="purple" isLoading={busyId === request.id} isDisabled={Boolean(busyId)} onClick={() => void updateRequest(request.id, "complete")}>{text.markCompleted}</Button>}
								{view === "sent" && request.status === "QUOTED" && <Flex mt="5" gap="3" wrap="wrap"><Button size="sm" colorScheme="green" isLoading={busyId === request.id} isDisabled={Boolean(busyId)} onClick={() => void updateRequest(request.id, "acceptQuote")}>{text.acceptQuote}</Button><Button size="sm" variant="outline" colorScheme="red" isDisabled={Boolean(busyId)} onClick={() => void updateRequest(request.id, "declineQuote")}>{text.declineQuote}</Button></Flex>}
								{view === "sent" && request.status === "NEW" && <Button mt="5" size="sm" variant="outline" isLoading={busyId === request.id} onClick={() => void updateRequest(request.id, "cancel")}>{text.cancelRequest}</Button>}
								{view === "sent" && request.status === "COMPLETED" && (request.review ? <Text mt="5" color="green.500" fontWeight="semibold">{text.reviewed} · {request.review.rating}/5</Text> : <Stack mt="5" p="4" bg={pageBg} border="1px solid" borderColor={border} borderRadius="xl"><Text fontWeight="semibold">{text.reviewProvider}</Text><Text fontSize="xs" color={muted}>{text.completedOnly}</Text><Select value={reviewRatings[request.id] || "5"} onChange={(event) => setReviewRatings((current) => ({ ...current, [request.id]: event.target.value }))}><option value="5">5 / 5</option><option value="4">4 / 5</option><option value="3">3 / 5</option><option value="2">2 / 5</option><option value="1">1 / 5</option></Select><Textarea value={reviewComments[request.id] || ""} onChange={(event) => setReviewComments((current) => ({ ...current, [request.id]: event.target.value }))} maxLength={1000} placeholder={text.reviewPlaceholder} /><Button size="sm" alignSelf="flex-start" colorScheme="orange" isLoading={busyId === request.id} isDisabled={Boolean(busyId)} onClick={() => void submitReview(request.id)}>{text.submitReview}</Button></Stack>)}
							</Box>;
						})}
					</SimpleGrid>
				)}
				{!loading && !loadError && total > pageSize && <Flex mt="6" justify="center" align="center" gap="4">
					<Button size="sm" variant="outline" isDisabled={page === 0} onClick={() => setPage((current) => current - 1)}>{text.previous}</Button>
					<Text fontSize="sm" color={muted}>{page + 1} / {Math.ceil(total / pageSize)}</Text>
					<Button size="sm" variant="outline" isDisabled={(page + 1) * pageSize >= total} onClick={() => setPage((current) => current + 1)}>{text.next}</Button>
				</Flex>}
			</Container>
		</Flex>
	</>;
}
