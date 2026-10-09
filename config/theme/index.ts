import { theme as defaultTheme, ChakraTheme } from "@chakra-ui/react";

const config: ChakraTheme = {
	...defaultTheme,
	fonts: {
		...defaultTheme.fonts,
		heading: "Inter, 'Noto Sans Ethiopic', 'Kefa III', Kefa, Avenir Next, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
		body: "Inter, 'Noto Sans Ethiopic', 'Kefa III', Kefa, Noto Sans, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
	},
	styles: {
		global: {
			"html, body": { color: "gray.800", background: "gray.50", minHeight: "100%" },
			"button, a": { WebkitTapHighlightColor: "transparent" },
			"::selection": { background: "#E9B75C", color: "#143A45" },
		},
	},
	components: {
		...defaultTheme.components,
		Button: {
			...defaultTheme.components.Button,
			baseStyle: { ...defaultTheme.components.Button.baseStyle, fontWeight: "semibold", borderRadius: "lg", transition: "all 160ms ease" },
		},
		Input: {
			...defaultTheme.components.Input,
			defaultProps: { ...defaultTheme.components.Input.defaultProps, focusBorderColor: "mainorange" },
		},
	},
	colors: {
		...defaultTheme.colors,
		maingray: "#143A45",
		mainred: "#BF4B3E",
		mainorange: "#C66B36",
		mainyellow: "#E9B75C",
		mainlightYellow: "#F1E5C3",
	},
};

export const theme = config;
