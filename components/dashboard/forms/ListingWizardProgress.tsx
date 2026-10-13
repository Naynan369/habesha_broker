import { Box, Flex, Progress, SimpleGrid, Text, useColorModeValue } from "@chakra-ui/react";
import { MdCheck } from "react-icons/md";

interface ListingWizardProgressProps {
	steps: string[];
	hints: string[];
	activeStep: number;
	stepLabel: string;
	ofLabel: string;
}

export function ListingWizardProgress({ steps, hints, activeStep, stepLabel, ofLabel }: ListingWizardProgressProps) {
	const surface = useColorModeValue("white", "#101010");
	const border = useColorModeValue("gray.200", "whiteAlpha.200");
	const muted = useColorModeValue("gray.600", "gray.400");
	const activeSurface = useColorModeValue("orange.50", "rgba(233,183,92,.12)");
	const activeBorder = useColorModeValue("orange.300", "orange.400");
	const inactiveNumber = useColorModeValue("gray.300", "whiteAlpha.300");
	const percent = steps.length ? ((activeStep + 1) / steps.length) * 100 : 0;

	return (
		<Box mb={{ base: 6, md: 8 }} p={{ base: 4, md: 5 }} bg={surface} border="1px solid" borderColor={border} borderRadius="2xl">
			<Flex align="center" justify="space-between" gap="3" mb="3">
				<Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing=".12em" color={muted}>
					{stepLabel} {activeStep + 1} {ofLabel} {steps.length}
				</Text>
				<Text fontSize="sm" fontWeight="semibold" noOfLines={1}>{steps[activeStep]}</Text>
			</Flex>
			<Progress value={percent} size="sm" colorScheme="orange" borderRadius="full" aria-label={`${stepLabel} ${activeStep + 1} ${ofLabel} ${steps.length}`} />
			<SimpleGrid columns={{ base: 2, md: steps.length }} spacing={{ base: 2, md: 3 }} mt="4">
				{steps.map((title, index) => {
					const isComplete = index < activeStep;
					const isCurrent = index === activeStep;
					return (
						<Flex
							key={title}
							align="center"
							gap="2.5"
							minW="0"
							p={{ base: 2, md: 3 }}
							border="1px solid"
							borderColor={isCurrent ? activeBorder : isComplete ? "green.400" : border}
							bg={isCurrent ? activeSurface : "transparent"}
							borderRadius="xl"
							aria-current={isCurrent ? "step" : undefined}
						>
							<Flex
								align="center"
								justify="center"
								flexShrink={0}
								w="8"
								h="8"
								borderRadius="full"
								bg={isComplete ? "green.500" : isCurrent ? "mainorange" : "transparent"}
								color={isComplete || isCurrent ? "white" : muted}
								border={isComplete || isCurrent ? "none" : "1px solid"}
								borderColor={inactiveNumber}
								fontSize="xs"
								fontWeight="bold"
							>
								{isComplete ? <MdCheck aria-hidden="true" /> : index + 1}
							</Flex>
							<Box minW="0">
								<Text fontSize="xs" fontWeight="semibold" noOfLines={1} color={isCurrent ? undefined : muted}>{title}</Text>
							</Box>
						</Flex>
					);
				})}
			</SimpleGrid>
			<Text mt="4" color={muted} fontSize="sm" lineHeight="1.6">{hints[activeStep]}</Text>
		</Box>
	);
}
