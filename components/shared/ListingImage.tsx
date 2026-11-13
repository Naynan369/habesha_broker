import { Box, Image, Text } from "@chakra-ui/react";
import { useState } from "react";
import { MdDirectionsCar, MdHomeWork, MdImageNotSupported, MdMiscellaneousServices, MdStorefront } from "react-icons/md";
import { getMediaUrl } from "@libs/helpers/media";

interface ListingImageProps {
	src?: string;
	alt: string;
	itemType?: string;
	w?: any;
	h?: any;
	width?: any;
	height?: any;
	borderRadius?: any;
	borderTopRadius?: any;
	borderLeftRadius?: any;
	objectFit?: any;
	position?: any;
	top?: any;
	left?: any;
	mb?: any;
	fill?: boolean;
	loading?: "eager" | "lazy";
}

export function ListingImage({
	src,
	alt,
	itemType,
	w = "full",
	h = "full",
	width,
	height,
	borderRadius,
	borderTopRadius,
	borderLeftRadius,
	objectFit = "cover",
	position,
	top,
	left,
	mb,
	fill = false,
	loading = "lazy",
}: ListingImageProps) {
	const imageUrl = getMediaUrl(src, "items");
	const [failedUrl, setFailedUrl] = useState<string | null>(null);
	const failed = !imageUrl || failedUrl === imageUrl;
	const isCar = itemType?.toUpperCase() === "CAR";
	const isBusinessSpace = itemType?.toUpperCase() === "BUSINESS_SPACE";
	const isService = itemType?.toUpperCase() === "SERVICE";
	const Icon = imageUrl ? MdImageNotSupported : isCar ? MdDirectionsCar : isBusinessSpace ? MdStorefront : isService ? MdMiscellaneousServices : MdHomeWork;

	const sharedProps = {
		w: width || w,
		h: height || h,
		borderRadius,
		borderTopRadius,
		borderLeftRadius,
		position: fill ? "absolute" : position,
		top: fill ? 0 : top,
		left: fill ? 0 : left,
		mb,
	};

	if (failed || !imageUrl) {
		return (
			<Box
				{...sharedProps}
				role="img"
				aria-label={alt}
				position={fill ? "absolute" : position || "relative"}
				top={fill ? 0 : top}
				left={fill ? 0 : left}
				display="flex"
				alignItems="center"
				justifyContent="center"
				flexDirection="column"
				gap="3"
				overflow="hidden"
				color="white"
				background="linear-gradient(135deg, #2b1e17 0%, #6c4c37 55%, #c9a46b 100%)"
			>
				<Box
					position="absolute"
					width="70%"
					height="70%"
					border="1px solid"
					borderColor="whiteAlpha.300"
					borderRadius="full"
					transform="translate(30%, 35%)"
				/>
				<Box position="relative" textAlign="center">
					<Icon size={42} />
					<Text mt="2" fontSize="xs" fontWeight="semibold" color="whiteAlpha.800">
						{isCar ? "Vehicle listing" : isBusinessSpace ? "Business space listing" : isService ? "Service listing" : "Property listing"}
					</Text>
				</Box>
			</Box>
		);
	}

	return (
		<Image
			{...sharedProps}
			alt={alt}
			src={imageUrl}
			loading={loading}
			objectFit={objectFit}
			onError={() => setFailedUrl(imageUrl)}
		/>
	);
}
