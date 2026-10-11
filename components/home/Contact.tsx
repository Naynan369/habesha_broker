import { Box, Button, useToast, Flex, FormControl, FormLabel, Heading, Input, Text, Textarea, useColorModeValue } from "@chakra-ui/react";
import { am } from "@locales/am";
import { en } from "@locales/en";
import { useRouter } from "next/router";
import { FormEvent } from "react";
import { MdArrowOutward, MdEmail, MdLocationOn } from "react-icons/md";

const contactEmail = "naolchala6@gmail.com";

export const HomeContact = () => {
	const { locale } = useRouter();
	const lang = locale === "am" ? am : en;
	const toast = useToast();
	const surface = useColorModeValue("white", "#1b2a30");
	const fieldBg = useColorModeValue("gray.50", "#142126");
	const fieldBorder = useColorModeValue("gray.200", "whiteAlpha.300");
	const textColor = useColorModeValue("#143A45", "#e7eff0");
	const mutedColor = useColorModeValue("gray.600", "gray.300");

	const submitContact = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		const subject = encodeURIComponent(`Habesha Brokers enquiry from ${String(form.get("name") || "")}`);
		const body = encodeURIComponent(`Name: ${form.get("name")}\nEmail: ${form.get("email")}\n\n${form.get("message")}`);
		window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
		toast({ title: lang.home.contact_ready_title, description: lang.home.contact_ready_description, status: "info", isClosable: true });
	};

	return (
		<Flex id="Contact" as="section" direction="column" py={{ base: 16, md: 24 }} px={{ base: 6, md: 12, xl: 16 }} bg="maingray" color="white">
			<Flex maxW="1440px" w="full" mx="auto" align={{ base: "flex-start", md: "flex-end" }} justify="space-between" gap="6" direction={{ base: "column", md: "row" }}>
				<Box>
					<Text color="mainyellow" textTransform="uppercase" letterSpacing=".18em" fontWeight="bold" fontSize="xs">{lang.home.contact_kicker}</Text>
					<Heading as="h2" mt="3" fontSize={{ base: "3xl", md: "5xl" }} letterSpacing="-.04em">{lang.home.contacttxt}</Heading>
				</Box>
				<Text color="whiteAlpha.700" maxW="450px" lineHeight="1.8">{lang.home.contact_description}</Text>
			</Flex>
			<Flex maxW="1440px" w="full" mx="auto" mt={{ base: 8, md: 12 }} direction={{ base: "column", lg: "row" }} gap={{ base: 6, lg: 8 }} align="stretch">
				<Flex flex="1" minH={{ base: "300px", md: "440px" }} direction="column" bg="whiteAlpha.100" border="1px solid" borderColor="whiteAlpha.200" borderRadius="2xl" overflow="hidden">
					<Flex p={{ base: 5, md: 6 }} align="center" gap="3"><Box color="mainyellow"><MdLocationOn size={22} /></Box><Box><Heading fontSize="md">{lang.home.contact_area_title}</Heading><Text color="whiteAlpha.700" fontSize="sm" mt="1">{lang.home.contact_area_description}</Text></Box></Flex>
					<Box flex="1" minH="250px">
						<iframe
							src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2789.8019339648663!2d39.285659566184584!3d8.559915798243486!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x164b1fa272b90363%3A0x3ff630d88d1e7fe4!2sAdamaScience%20and%20Technology%20University%2C%20irreecha%20gateway!5e0!3m2!1sen!2sus!4v1644585853166!5m2!1sen!2sus"
							title={lang.home.map_title}
							style={{ border: 0, width: "100%", height: "100%", minHeight: "250px", display: "block" }}
							loading="lazy"
							referrerPolicy="no-referrer-when-downgrade"
						></iframe>
					</Box>
				</Flex>
				<Box flex="1" bg={surface} color={textColor} border="1px solid" borderColor={fieldBorder} borderRadius="2xl" p={{ base: 6, md: 8 }}>
					<Flex align="center" gap="3"><Box color="mainred"><MdEmail size={22} /></Box><Heading fontSize="xl">{lang.home.msgus}</Heading></Flex>
					<Text color={mutedColor} mt="3" mb="5" lineHeight="1.7">{lang.home.contact_form_description}</Text>
					<form onSubmit={submitContact}>
						<FormControl mb="4" isRequired><FormLabel htmlFor="name">{lang.home.contactForm.name}</FormLabel><Input id="name" name="name" type="text" autoComplete="name" placeholder={lang.home.contact_name_placeholder} bg={fieldBg} borderColor={fieldBorder} color={textColor} _hover={{ bg: fieldBg }} _focus={{ bg: fieldBg, borderColor: "mainred", boxShadow: "0 0 0 1px #D62828" }} /></FormControl>
						<FormControl mb="4" isRequired><FormLabel htmlFor="email">{lang.home.contactForm.email}</FormLabel><Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" bg={fieldBg} borderColor={fieldBorder} color={textColor} _hover={{ bg: fieldBg }} _focus={{ bg: fieldBg, borderColor: "mainred", boxShadow: "0 0 0 1px #D62828" }} /></FormControl>
						<FormControl mb="5" isRequired><FormLabel htmlFor="msg">{lang.home.contactForm.msg}</FormLabel><Textarea id="msg" name="message" required rows={4} placeholder={lang.home.contact_message_placeholder} bg={fieldBg} borderColor={fieldBorder} color={textColor} _hover={{ bg: fieldBg }} _focus={{ bg: fieldBg, borderColor: "mainred", boxShadow: "0 0 0 1px #D62828" }} /></FormControl>
						<Flex justify="space-between" align="center" gap="4" flexWrap="wrap"><Text color="gray.500" fontSize="xs">{lang.home.contact_email_note}</Text><Button type="submit" bg="mainred" color="white" borderRadius="xl" rightIcon={<MdArrowOutward />} _hover={{ bg: "#ae2020" }}>{lang.home.contactForm.sbmt}</Button></Flex>
					</form>
				</Box>
			</Flex>
		</Flex>
	);
};
