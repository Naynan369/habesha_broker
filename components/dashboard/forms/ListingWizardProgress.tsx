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
	const surface = useColorModeValue("#ffffff", "#111719");
	const border = useColorModeValue("#dce3e1", "whiteAlpha.200");
	const muted = useColorModeValue("#637278", "#a5b1b4");
	const activeSurface = useColorModeValue("#fff8ec", "rgba(233,183,92,.10)");
	const activeBorder = useColorModeValue("#d88a52", "orange.400");
	const inactiveNumber = useColorModeValue("gray.300", "whiteAlpha.300");
	const progressTrack = useColorModeValue("#e8eeec", "whiteAlpha.200");
	const percent = steps.length ? ((activeStep + 1) / steps.length) * 100 : 0;

	return (
		<Box className="dashboard-wizard-progress" mb={{ base: 6, md: 8 }} p={{ base: 4, md: 6 }} bg={surface} border="1px solid" borderColor={border} borderRadius="2xl" boxShadow="0 12px 30px rgba(21,42,44,.045)">
			<Flex align="center" justify="space-between" gap="3" mb="3">
				<Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing=".12em" color={muted}>
					{stepLabel} {activeStep + 1} {ofLabel} {steps.length}
				</Text>
				<Text fontSize="sm" fontWeight="semibold" noOfLines={1}>{steps[activeStep]}</Text>
			</Flex>
			<Progress value={percent} h="2" colorScheme="orange" borderRadius="full" bg={progressTrack} aria-label={`${stepLabel} ${activeStep + 1} ${ofLabel} ${steps.length}`} />
			<SimpleGrid columns={{ base: 2, md: steps.length }} spacing={{ base: 2, md: 3 }} mt="4">
				{steps.map((title, index) => {
					const isComplete = index < activeStep;
					const isCurrent = index === activeStep;
					return (
						<Flex
							key={title}
							className={isCurrent ? "dashboard-wizard-step dashboard-wizard-step-current" : "dashboard-wizard-step"}
							align="center"
							gap="2.5"
							minW="0"
							p={{ base: 2, md: 3 }}
							border="1px solid"
							borderColor={isCurrent ? activeBorder : isComplete ? "green.400" : border}
							bg={isCurrent ? activeSurface : "transparent"}
							borderRadius="xl"
							boxShadow={isCurrent ? "0 8px 20px rgba(198,107,54,.10)" : "none"}
							transition="border-color 220ms ease, background-color 220ms ease, box-shadow 220ms ease, transform 220ms ease"
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
