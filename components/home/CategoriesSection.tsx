import { Box, Button, Flex, Heading, Text } from "@chakra-ui/react";
import { MyTheme } from "@config/theme/MyTheme";
import { useFilter } from "@libs/store";
import { useRouter } from "next/router";
import { MdArrowForward, MdCarRental, MdHouse } from "react-icons/md";

export const CategoriesSection = () => (
	<Flex
		id="categories"
		minHeight={{ base: "auto", lg: "78vh" }}
		direction="column"
		px={MyTheme.paddings.pagePadding}
		py={{ base: 16, md: 24 }}
		bg="gray.50"
	>
		<Text color="mainred" textTransform="uppercase" letterSpacing="0.16em" fontWeight="bold" fontSize="sm">
			Browse what you need
		</Text>
		<Heading mt="3" fontSize={{ base: "3xl", md: "5xl" }} color="maingray" letterSpacing="-0.03em">
			Find by category
		</Heading>
		<Text mt="3" color="gray.600" maxW="620px" fontSize={{ base: "md", md: "lg" }}>
			Explore carefully organized listings for homes and vehicles across Ethiopia.
		</Text>
		<Flex gap={{ base: 5, md: 8 }} alignItems="stretch" justifyContent="center" flex="1" mt={{ base: 10, md: 14 }} flexWrap="wrap">
			<Category title="Homes" itemType="HOUSE" icon={<MdHouse size={38} />} description="Homes to rent or buy, with the details that help you compare." />
			<Category title="Vehicles" itemType="CAR" icon={<MdCarRental size={38} />} description="Browse vehicles by price, condition, and seller." />
		</Flex>
	</Flex>
);

const Category = ({ title, itemType, icon, description }) => {
	const setField = useFilter((state) => state.setField);
	const router = useRouter();
	return (
		<Button
			onClick={() => {
			setField("itemType", itemType);
			router.push("/explore");
		}}
			aria-label={`Browse ${title.toLowerCase()}`}
			display="flex"
			flexDirection="column"
			alignItems="flex-start"
			justifyContent="space-between"
			textAlign="left"
			whiteSpace="normal"
			fontWeight="normal"
			color="white"
			bg="maingray"
			_hover={{ bg: "#0d455e", transform: "translateY(-4px)", boxShadow: "2xl" }}
			_active={{ transform: "translateY(-1px)" }}
			transition="all 180ms ease"
			borderRadius="2xl"
			boxShadow="xl"
			minH={{ base: "230px", md: "270px" }}
			flex="1"
			minW={{ base: "100%", md: "280px" }}
			maxW="510px"
			p={{ base: 7, md: 10 }}
		>
			<Box color="mainyellow" bg="whiteAlpha.100" p="4" borderRadius="xl">{icon}</Box>
			<Box mt="8">
				<Heading fontSize={{ base: "2xl", md: "3xl" }}>{title}</Heading>
				<Text mt="3" color="whiteAlpha.800" fontSize="md" fontWeight="normal">{description}</Text>
			</Box>
			<Flex mt="8" alignItems="center" color="mainyellow" gap="2" fontWeight="bold">
				View listings <MdArrowForward />
			</Flex>
		</Button>
	);
};
