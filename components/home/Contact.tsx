import {
	Box,
	Button,
	useToast,
	Flex,
	FormControl,
	FormLabel,
	Heading,
	Input,
	Textarea,
} from "@chakra-ui/react";
import { MyTheme } from "@config/theme/MyTheme";
import { am } from "@locales/am";
import { en } from "@locales/en";
import { useRouter } from "next/router";
import { FormEvent } from "react";

export const HomeContact = () => {
	const { locale } = useRouter();
	const lang = locale == "am" ? am : en;
	const toast = useToast();

	const submitContact = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		const message = "Name: " + form.get("name") + "\nEmail: " + form.get("email") + "\n\n" + form.get("message");
		try {
			await navigator.clipboard.writeText(message);
			toast({ title: "Message copied", description: "Paste it into an email to naolchala6@gmail.com.", status: "success", isClosable: true });
		} catch (_error) {
			toast({ title: "Message ready", description: "Email naolchala6@gmail.com with your message.", status: "info", isClosable: true });
		}
	};

	return (
		<Flex
			id="Contact"
			scrollSnapAlign={"center"}
			minHeight={{ base: "auto", md: "100vh" }}
			width="100%"
			direction="column"
			py={"14"}
			px={MyTheme.paddings.pagePaddingArray}
			background="maingray"
			color={"white"}
		>
			<Heading
				as="h1"
				mb={["10", "10", "0"]}
				fontSize={{ base: "4xl", md: "5xl" }}
				color={"mainlightYellow"}
			>
				{lang.home.contacttxt}
			</Heading>
			<Flex direction={{ base: "column", md: "row" }} flex={"1"}>
				<Flex
					flex={"1"}
					direction={"column"}
					mt={{ base: "5", md: "14" }}
				>
					<Heading fontSize={"xl"} color={"white"}>
						{lang.home.ourlocation}
					</Heading>
					<Box height={"100%"} pr="10" py="10">
						<iframe
							src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2789.8019339648663!2d39.285659566184584!3d8.559915798243486!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x164b1fa272b90363%3A0x3ff630d88d1e7fe4!2sAdamaScience%20and%20Technology%20University%2C%20irreecha%20gateway!5e0!3m2!1sen!2sus!4v1644585853166!5m2!1sen!2sus"
							title="Map showing the Habesha Brokers area"
							style={{ border: 0, width: "100%", height: "100%", borderRadius: "16px" }}
							loading="lazy"
						></iframe>
					</Box>
				</Flex>
				<Flex
					flex={"1"}
					direction={"column"}
					ml={{ base: "0", md: "10" }}
					mt={{ base: "10", md: "0" }}
				>
					<Heading fontSize={"xl"} color={"white"}>
						{lang.home.msgus}
					</Heading>
					<Box mt="6">
						<form onSubmit={submitContact}>
							<FormControl my="5">
								<FormLabel htmlFor="name">
									{lang.home.contactForm.name}
								</FormLabel>
								<Input
									variant={"flushed"}
									id="name"
									name="name"
									type="text"
									required
								></Input>
							</FormControl>
							<FormControl my="5">
								<FormLabel htmlFor="email">
									{lang.home.contactForm.email}
								</FormLabel>
								<Input
									variant={"flushed"}
									type="email"
									id="email"
									name="email"
									required
								></Input>
							</FormControl>
							<FormControl my="5">
								<FormLabel htmlFor="msg">
									{lang.home.contactForm.msg}
								</FormLabel>
								<Textarea
									id="msg"
									name="message"
									required
									rows={5}
									variant={"flushed"}
								></Textarea>
							</FormControl>

							<Flex mt="20" justifyContent={"flex-end"}>
								<Button
									type="submit"
									size={"lg"}
									textTransform={"uppercase"}
									colorScheme={"yellow"}
								>
									{lang.home.contactForm.sbmt}
								</Button>
							</Flex>
						</form>
					</Box>
				</Flex>
			</Flex>
		</Flex>
	);
};
