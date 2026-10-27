import { Alert, AlertDescription, AlertIcon, AlertTitle, Avatar, Badge, Box, Button, Container, Flex, FormControl, FormLabel, Heading, Select, SimpleGrid, Skeleton, Stack, Text, Textarea, useColorModeValue, useToast } from "@chakra-ui/react";
import { ListingImage } from "@components/shared/ListingImage";
import { SiteNavbar } from "@components/shared/SiteNavbar";
import { withSessionSsr } from "@config/cookie/cookie";
import { useLang } from "@libs/hooks/useLang";
import { useUser } from "@libs/store";
import axios from "axios";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";

export const getServerSideProps = withSessionSsr(async ({ req }) => {
  if (!req.user || req.user.role !== "ADMIN") return { notFound: true };
  return { props: { user: req.user } };
});

export default function ListingReportsPage({ user }: { user: any }) {
  const lang = useLang();
  const copy = lang.adminPage.reports;
  const reasons = lang.itemDetailPage.reportReasons;
  const router = useRouter();
  const toast = useToast();
  const { logout } = useUser();
  const [status, setStatus] = useState("OPEN");
  const [page, setPage] = useState(0);
  const [reports, setReports] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const background = useColorModeValue("#f4f6f8", "#000000");
  const surface = useColorModeValue("white", "#101010");
  const border = useColorModeValue("gray.200", "whiteAlpha.200");
  const muted = useColorModeValue("gray.600", "gray.400");
  const noteSurface = useColorModeValue("gray.50", "whiteAlpha.50");
  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await axios.get(`/api/admin/reports?status=${status}&page=${page}`);
      setReports(response.data.reports || []);
      setTotal(response.data.total || 0);
    } catch {
      setReports([]);
      setTotal(0);
      setError(true);
    } finally { setLoading(false); }
  }, [status, page]);
  useEffect(() => { void load(); }, [load]);

  const handleLogout = async () => {
    logout();
    try { await axios.post("/api/user/logout"); } finally { await router.replace("/auth/login"); }
  };
  const applyAction = async (report: any, action: string) => {
    setBusyId(report.id);
    try {
      await axios.post("/api/admin/reports", { reportId: report.id, action, note: notes[report.id] || "" });
      toast({ title: action === "removeListing" ? copy.removed : copy.updated, status: "success", duration: 4000, isClosable: true });
      await load();
    } catch (requestError: any) {
      toast({ title: copy.updateError, description: requestError?.response?.data?.err || copy.updateError, status: "error", duration: 5000, isClosable: true });
    } finally { setBusyId(""); }
  };
  const active = (report: any) => report.status === "OPEN" || report.status === "REVIEWING";

  return <>
    <Head><title>{copy.title} | Habesha Brokers</title></Head>
    <Flex minH="100dvh" direction="column" bg={background}>
      <SiteNavbar mode="admin" user={user} onLogout={handleLogout} />
      <Container maxW="7xl" py={{ base: 6, md: 10 }} flex="1">
        <Flex direction={{ base: "column", md: "row" }} align={{ base: "stretch", md: "flex-end" }} justify="space-between" gap="4" mb="6" p={{ base: 5, md: 7 }} bg={surface} border="1px solid" borderColor={border} borderRadius="2xl" boxShadow="0 16px 42px rgba(20,32,38,.07)">
          <Box><Text color="mainorange" fontSize="xs" fontWeight="bold" letterSpacing=".14em" textTransform="uppercase">{lang.adminPage.kicker}</Text><Heading mt="2" size={{ base: "lg", md: "xl" }}>{copy.title}</Heading><Text mt="2" color={muted} maxW="3xl">{copy.description}</Text></Box>
          <Button as={Link} href="/admin" variant="outline" borderRadius="xl">{lang.common.adminConsole}</Button>
        </Flex>
        <Flex direction={{ base: "column", sm: "row" }} align={{ base: "stretch", sm: "center" }} justify="space-between" gap="4" mb="5">
          <Flex align="center" gap="3"><Badge borderRadius="full" colorScheme="orange" px="3" py="1">{total}</Badge><Text color={muted} fontSize="sm">{copy.title}</Text></Flex>
          <FormControl maxW={{ sm: "xs" }}><FormLabel srOnly>{copy.status}</FormLabel><Select value={status} onChange={(event) => { setPage(0); setStatus(event.target.value); }} bg={surface} borderColor={border} borderRadius="xl">{Object.entries(copy.statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></FormControl>
        </Flex>
        {error && <Alert status="error" borderRadius="xl" mb="5"><AlertIcon /><Box><AlertTitle>{copy.loadError}</AlertTitle><AlertDescription>{lang.serviceRequestsPage.tryAgain}</AlertDescription></Box><Button ml="auto" size="sm" onClick={() => void load()}>{lang.serviceRequestsPage.retry}</Button></Alert>}
        {loading ? <Stack spacing="4">{[0, 1, 2].map((n) => <Skeleton key={n} h="250px" borderRadius="2xl" />)}</Stack> : !error && reports.length === 0 ? <Flex justify="center" align="center" minH="240px" p="8" bg={surface} border="1px solid" borderColor={border} borderRadius="2xl"><Text color={muted}>{copy.empty}</Text></Flex> : !error && <Stack spacing="4">
          {reports.map((report) => <Box key={report.id} p={{ base: 4, md: 6 }} bg={surface} border="1px solid" borderColor={border} borderRadius="2xl" boxShadow="0 10px 30px rgba(20,32,38,.05)">
            <Flex direction={{ base: "column", md: "row" }} align="stretch" gap="5">
              {report.item && <Box w={{ base: "full", md: "220px" }} h={{ base: "180px", md: "155px" }} flexShrink="0" overflow="hidden" borderRadius="xl"><ListingImage src={report.item.images?.[0]} alt={report.item.title} itemType={report.item.itemType} /></Box>}
              <Box flex="1" minW="0">
                <Flex justify="space-between" align="flex-start" gap="3" wrap="wrap"><Box minW="0"><Text fontSize="xs" fontWeight="bold" letterSpacing=".1em" color="mainorange" textTransform="uppercase">{copy.listing}</Text><Heading mt="1" size="sm" noOfLines={2}>{report.item?.title || lang.itemDetailPage.descriptionEmpty}</Heading></Box><Badge colorScheme={report.status === "OPEN" ? "orange" : report.status === "REVIEWING" ? "blue" : report.status === "RESOLVED" ? "green" : "gray"} borderRadius="full" px="3" py="1">{copy.statuses[report.status] || report.status}</Badge></Flex>
                <SimpleGrid mt="4" columns={{ base: 1, sm: 2 }} spacing="3">
                  <Box><Text color={muted} fontSize="xs">{copy.reason}</Text><Text mt="1" fontWeight="semibold">{reasons[report.reason] || report.reason}</Text></Box>
                  <Box><Text color={muted} fontSize="xs">{copy.reportedBy}</Text><Flex align="center" gap="2" mt="1"><Avatar size="xs" name={`${report.reporter?.firstName || ""} ${report.reporter?.lastName || ""}`} /><Text fontSize="sm" wordBreak="break-word">{report.reporter?.email || lang.adminPage.users.accountUnavailable}</Text></Flex></Box>
                  <Box><Text color={muted} fontSize="xs">{copy.reportedAt}</Text><Text mt="1" fontSize="sm">{new Date(report.createdAt).toLocaleString(router.locale === "am" ? "am-ET" : "en-ET")}</Text></Box>
                  {report.item?.user && <Box><Text color={muted} fontSize="xs">{lang.adminPage.listing.sellerRole}: {report.item.user.firstName} {report.item.user.lastName}</Text><Text mt="1" fontSize="sm" wordBreak="break-word">{report.item.user.email}</Text></Box>}
                </SimpleGrid>
                {report.details && <Box mt="4" p="3" bg={noteSurface} borderRadius="lg"><Text color={muted} fontSize="xs">{copy.details}</Text><Text mt="1" fontSize="sm" whiteSpace="pre-wrap" wordBreak="break-word">{report.details}</Text></Box>}
                {report.reviewNote && <Text mt="3" fontSize="sm" color={muted}>{copy.internalNote}: {report.reviewNote}</Text>}
                <Flex mt="4" gap="3" wrap="wrap">
                  {report.item && <Button as={Link} href={`/items/${report.item.id}`} size="sm" variant="outline" borderRadius="lg">{copy.openListing}</Button>}
                  {active(report) && report.status === "OPEN" && <Button size="sm" colorScheme="blue" variant="outline" isLoading={busyId === report.id} onClick={() => void applyAction(report, "review")}>{copy.review}</Button>}
                  {active(report) && <Button size="sm" colorScheme="green" variant="outline" isLoading={busyId === report.id} isDisabled={Boolean(busyId)} onClick={() => void applyAction(report, "resolve")}>{copy.resolve}</Button>}
                  {active(report) && <Button size="sm" colorScheme="gray" variant="outline" isLoading={busyId === report.id} isDisabled={Boolean(busyId)} onClick={() => void applyAction(report, "dismiss")}>{copy.dismiss}</Button>}
                  {active(report) && report.item?.status === "APPROVED" && <Button size="sm" colorScheme="red" variant="outline" isLoading={busyId === report.id} isDisabled={Boolean(busyId)} onClick={() => void applyAction(report, "removeListing")}>{copy.removeListing}</Button>}
                </Flex>
                {active(report) && <FormControl mt="4"><FormLabel fontSize="sm">{copy.internalNote}</FormLabel><Textarea value={notes[report.id] ?? report.reviewNote ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [report.id]: event.target.value }))} maxLength={1000} placeholder={copy.notePlaceholder} /></FormControl>}
              </Box>
            </Flex>
          </Box>)}
        </Stack>}
        {!loading && !error && total > pageSize && <Flex mt="6" justify="center" align="center" gap="4"><Button variant="outline" isDisabled={page === 0} onClick={() => setPage((current) => current - 1)}>{copy.previous}</Button><Text color={muted} fontSize="sm">{copy.page.replace("{page}", String(page + 1)).replace("{pages}", String(Math.ceil(total / pageSize)))}</Text><Button variant="outline" isDisabled={(page + 1) * pageSize >= total} onClick={() => setPage((current) => current + 1)}>{copy.next}</Button></Flex>}
      </Container>
    </Flex>
  </>;
}
