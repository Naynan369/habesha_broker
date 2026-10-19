import { Box, Image } from "@chakra-ui/react";

/** Displays the transparent horizontal wordmark across light and dark surfaces. */
export function BrandLogo({ compact = false }: { compact?: boolean }) {
	return (
		<Box
			role="img"
			aria-label="Habesha Brokers"
			position="relative"
			flexShrink={0}
			w={compact ? { base: "112px", sm: "192px" } : { base: "156px", sm: "192px" }}
			h={compact ? { base: "20px", sm: "32px" } : { base: "26px", sm: "32px" }}
			bg="transparent"
			overflow="hidden"
		>
			<Image
				aria-hidden="true"
				alt=""
				src="/habesha-brokers-logo.png"
				position="absolute"
				inset="0"
				w="100%"
				h="100%"
				objectFit="cover"
				objectPosition="center"
			/>
		</Box>
	);
}
