import { IconButton, Tooltip, useColorMode, useColorModeValue } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { MdDarkMode, MdLightMode } from "react-icons/md";

export function ColorModeToggle() {
	const { colorMode, toggleColorMode } = useColorMode();
	const { locale } = useRouter();
	const isDark = colorMode === "dark";
	const label = locale === "am"
		? isDark ? "ወደ ብርሃን ገጽታ ይቀይሩ" : "ወደ ጨለማ ገጽታ ይቀይሩ"
		: isDark ? "Switch to light mode" : "Switch to dark mode";
	const background = useColorModeValue("white", "#171717");
	const foreground = useColorModeValue("#143A45", "#f0c978");
	const border = useColorModeValue("blackAlpha.200", "whiteAlpha.200");

	return (
		<Tooltip label={label} placement="left" hasArrow>
			<IconButton
				aria-label={label}
				icon={isDark ? <MdLightMode size="20" /> : <MdDarkMode size="20" />}
				onClick={toggleColorMode}
				variant="solid"
				bg={background}
				color={foreground}
				border="1px solid"
				borderColor={border}
				boxShadow="0 6px 18px rgba(8, 24, 30, .16)"
				borderRadius="full"
				size="sm"
				_focusVisible={{ outline: "3px solid #E9B75C", outlineOffset: "2px" }}
				_hover={{ bg: background, color: foreground, transform: "translateY(-2px)", boxShadow: "0 12px 28px rgba(8, 24, 30, .24)" }}
				_active={{ bg: background, color: foreground, transform: "scale(.96)" }}
				transition="all 160ms ease"
			/>
		</Tooltip>
	);
}
