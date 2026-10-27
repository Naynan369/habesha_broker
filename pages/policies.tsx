import { Box, Container, Flex, Heading, Stack, Text, useColorModeValue } from "@chakra-ui/react";
import { HomeFooter } from "@components/home/Footer";
import { SiteNavbar } from "@components/shared/SiteNavbar";
import { withSessionSsr } from "@config/cookie/cookie";
import { useLang } from "@libs/hooks/useLang";
import Head from "next/head";

export const getServerSideProps = withSessionSsr(async ({ req }) => ({ props: { user: req.user || null } }));

export default function PoliciesPage({ user }: { user: any }) {
  const lang = useLang();
  const copy = lang.policies;
  const background = useColorModeValue("#f4f2ee", "#080a0b");
  const surface = useColorModeValue("#ffffff", "#111416");
  const border = useColorModeValue("#e5e7eb", "rgba(255,255,255,.10)");
  const muted = useColorModeValue("#667085", "#a7b0b8");
  const sectionSurface = useColorModeValue("gray.50", "whiteAlpha.50");
  const noticeSurface = useColorModeValue("orange.50", "whiteAlpha.100");
  const sections = [
    [copy.marketplace, copy.marketplaceBody], [copy.safety, copy.safetyBody],
    [copy.reporting, copy.reportingBody], [copy.services, copy.servicesBody],
    [copy.fees, copy.feesBody], [copy.privacy, copy.privacyBody], [copy.contact, copy.contactBody],
  ];
  return <>
    <Head><title>{copy.pageTitle}</title><meta name="description" content={copy.intro} /></Head>
    <Flex minH="100dvh" direction="column" bg={background}>
      <SiteNavbar mode="public" user={user} />
      <Container as="main" maxW="5xl" flex="1" py={{ base: 8, md: 14 }} px={{ base: 4, md: 8 }}>
        <Box p={{ base: 5, md: 9 }} bg={surface} border="1px solid" borderColor={border} borderRadius="3xl" boxShadow="0 18px 52px rgba(20,32,38,.08)">
          <Text color="mainorange" fontSize="xs" fontWeight="bold" letterSpacing=".14em" textTransform="uppercase">Habesha Brokers</Text>
          <Heading mt="2" fontSize={{ base: "2xl", md: "4xl" }}>{copy.heading}</Heading>
          <Text mt="4" maxW="3xl" color={muted} lineHeight="1.8">{copy.intro}</Text>
          <Stack mt={{ base: 7, md: 9 }} spacing="4">
            {sections.map(([title, body], index) => <Box key={title} p={{ base: 4, md: 5 }} bg={sectionSurface} border="1px solid" borderColor={border} borderRadius="2xl">
              <Flex align="center" gap="3"><Text color="mainorange" fontSize="xs" fontWeight="bold">{String(index + 1).padStart(2, "0")}</Text><Heading size="sm">{title}</Heading></Flex>
              <Text mt="3" color={muted} lineHeight="1.85">{body}</Text>
            </Box>)}
          </Stack>
          <Text mt="6" p="4" borderRadius="xl" bg={noticeSurface} color={muted} fontSize="sm" lineHeight="1.75">{copy.legalNote}</Text>
        </Box>
      </Container>
      <HomeFooter />
    </Flex>
  </>;
}
