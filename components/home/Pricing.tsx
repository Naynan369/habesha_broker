import { Button, Flex, Heading, Text } from "@chakra-ui/react";
import { MyTheme } from "@config/theme/MyTheme";
import Link from "next/link";

export const PricingSection = () => {
	return (
		<Flex
			minHeight={"100vh"}
			px={MyTheme.paddings.pagePadding}
			my="20"
			direction={"column"}
		>
			<Heading
				mb="10"
				textAlign={"center"}
				fontSize={"5xl"}
				color="maingray"
			>
				Pricing
			</Heading>
			<Flex justifyContent="center" wrap={"wrap"} gap="10">
				<Flex
					alignItems={"center"}
					direction={"column"}
					p="10"
					boxShadow={"md"}
					width="clamp(250px, 30%, 400px)"
					textAlign={"center"}
					background="mainorange"
					color={"white"}
					borderRadius="lg"
				>
					<Heading fontSize={"5xl"} mb="5">
						500 <sub>ETB</sub>
					</Heading>
					<Text my="5">
						Most house and car sellers and buyers disappointed with
						the high commissions that&apos;s asked by every brokers
						in Ethiopia we are here to solve that problem for our
						customer, our pricing method is fixed you only have to
						pay once then the service will be free.
					</Text>
					<Link href={"/auth/sign_up"} passHref>
						<Button as="a" background="white" color="mainorange" borderRadius="full" mt="10">Get Started</Button>
					</Link>
				</Flex>
			</Flex>
		</Flex>
	);
};
