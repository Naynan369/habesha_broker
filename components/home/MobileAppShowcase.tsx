import { Box, Flex, Heading, Image, Text, useColorModeValue } from "@chakra-ui/react";
import { useLang } from "@libs/hooks/useLang";
import { MdBookmarkBorder, MdPhoneIphone, MdSearch } from "react-icons/md";

export function MobileAppShowcase() {
	const copy = useLang().mobileApp;
	const sectionBg = useColorModeValue("#eee7df", "#050505");
	const panelBg = useColorModeValue("#fffdfa", "#101010");
	const border = useColorModeValue("#ded2c6", "rgba(255,255,255,.16)");
	const heading = useColorModeValue("#252725", "#f5f2ed");
	const badgeBg = useColorModeValue("#f3e6d4", "rgba(233,183,92,.13)");
	const panelShadow = useColorModeValue("0 12px 34px rgba(55,42,32,.07)", "0 12px 34px rgba(0,0,0,.2)");

	return (
		<Box as="section" id="mobile-app" bg={sectionBg} px={{ base: 3, sm: 6, lg: 10 }} py={{ base: 7, md: 10 }}>
			<Flex maxW="1180px" mx="auto" minH={{ base: "250px", md: "300px" }} bg={panelBg} border="1px solid" borderColor={border} borderRadius={{ base: "2xl", lg: "3xl" }} overflow="hidden" boxShadow={panelShadow} direction="row">
				<Flex flex="1" minW="0" direction="column" justify="center" align="flex-start" p={{ base: 4, sm: 7, lg: 10 }}>
					<Flex align="center" gap="2" px="2.5" py="1.5" bg={badgeBg} color={heading} borderRadius="full" fontSize={{ base: "2xs", sm: "xs" }} fontWeight="bold" letterSpacing=".02em"><MdPhoneIphone size={15} />{copy.status}</Flex>
					<Heading as="h2" mt={{ base: 3, sm: 4 }} maxW="540px" color={heading} fontSize={{ base: "lg", sm: "2xl", lg: "4xl" }} lineHeight="1.15" letterSpacing="-.035em">{copy.title}</Heading>
				</Flex>
				<Flex position="relative" flex={{ base: "0 0 38%", sm: "0 0 34%" }} minH={{ base: "250px", md: "300px" }} align="center" justify="center" overflow="hidden" bg="linear-gradient(145deg, #6c4c37, #2b1e17 62%, #493326)" px={{ base: 2, sm: 4 }} pt="5">
					<Box position="absolute" w="260px" h="260px" border="1px solid rgba(233,183,92,.13)" borderRadius="full" boxShadow="0 0 0 34px rgba(233,183,92,.025), 0 0 0 70px rgba(233,183,92,.02)" aria-hidden="true" />
					<Box aria-hidden="true" position="relative" w={{ base: "116px", sm: "150px" }} h={{ base: "214px", sm: "270px" }} bg="#241a14" p="5px" border="1px solid #67777a" borderBottom="0" borderTopRadius="28px" boxShadow="0 16px 34px rgba(0,0,0,.3)" overflow="hidden" alignSelf="flex-end">
						<Box h="full" bg="#f8f7f3" borderTopRadius="29px" overflow="hidden">
							<Flex h="18px" align="center" justify="space-between" px="2.5" color="#3b2b22"><Text fontSize="7px" fontWeight="bold">9:41</Text><Box w="28px" h="7px" bg="#241a14" borderRadius="full" /><Text fontSize="7px" fontWeight="bold">•••</Text></Flex>
							<Flex align="center" justify="space-between" px="2.5" py="1.5"><Text color="#3b2b22" fontSize={{ base: "7px", sm: "9px" }} fontWeight="extrabold" letterSpacing="-.04em">HB</Text><Box color="#a2663f"><MdBookmarkBorder size={13} /></Box></Flex>
							<Box position="relative" h={{ base: "72px", sm: "98px" }} mx="2" borderRadius="10px" overflow="hidden" bg="#52392a"><Image src="/assets/images/apartment-interior-showcase.jpg" alt="" w="full" h="full" objectFit="cover" /><Box position="absolute" inset="0" bg="linear-gradient(180deg, transparent 25%, rgba(22,15,10,.75))" /><Text position="absolute" left="2" bottom="2" color="white" fontSize={{ base: "8px", sm: "11px" }} fontWeight="bold" lineHeight="1.2">{copy.previewTitle}</Text></Box>
							<Flex mx="2" mt="1.5" px="2" h="23px" align="center" gap="1.5" bg="white" border="1px solid #d8dfdc" borderRadius="md" color="#6d7a78"><MdSearch size={11} /><Text fontSize="7px">{copy.previewSearch}</Text></Flex>
							<Text mx="2.5" mt="2" color="#3b2b22" fontSize="7px" fontWeight="bold">{copy.previewCategory}</Text>
							<Flex mx="2" mt="1.5" gap="1"><Box flex="1" h={{ base: "27px", sm: "37px" }} borderRadius="md" bgImage="url('/assets/images/supercar-showcase.jpg')" bgSize="cover" bgPosition="center" /><Box flex="1" h={{ base: "27px", sm: "37px" }} borderRadius="md" bgImage="url('/assets/images/apartment-showcase.jpg')" bgSize="cover" bgPosition="center" /></Flex>
						</Box>
					</Box>
				</Flex>
			</Flex>
		</Box>
	);
}
