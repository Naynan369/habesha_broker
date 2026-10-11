import { theme as defaultTheme, ChakraTheme } from "@chakra-ui/react";
import { mode } from "@chakra-ui/theme-tools";

const visibleFieldVariant = (props: any) => {
	const background = mode("white", "#17262b")(props);
	const borderColor = mode("gray.300", "whiteAlpha.300")(props);
	const hoverBorderColor = mode("gray.400", "whiteAlpha.500")(props);
	return {
		field: {
			background,
			color: mode("#25383d", "#e8eff0")(props),
			border: "1px solid",
			borderColor,
			borderRadius: "xl",
			transition: "background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease",
			_placeholder: { color: mode("gray.500", "gray.400")(props), opacity: 1 },
			_hover: { background, borderColor: hoverBorderColor },
			_focus: { background, borderColor: "mainorange", boxShadow: "0 0 0 1px #C66B36" },
			_disabled: { opacity: 0.65, cursor: "not-allowed" },
		},
	};
};

const config: ChakraTheme = {
	...defaultTheme,
	config: {
		initialColorMode: "light",
		useSystemColorMode: false,
	},
	fonts: {
		...defaultTheme.fonts,
		heading: "Inter, 'Noto Sans Ethiopic', 'Kefa III', Kefa, Avenir Next, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
		body: "Inter, 'Noto Sans Ethiopic', 'Kefa III', Kefa, Noto Sans, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
	},
	styles: {
		global: (props) => ({
			"html, body, #__next": {
				color: mode("#25383d", "#e8eff0")(props),
				background: mode("#f5f5f1", "#10191d")(props),
				minHeight: "100%",
			},
			"button, a": { WebkitTapHighlightColor: "transparent" },
			"::selection": { background: "#E9B75C", color: "#143A45" },
		}),
	},
	components: {
		...defaultTheme.components,
		Button: {
			...defaultTheme.components.Button,
			baseStyle: { ...defaultTheme.components.Button.baseStyle, fontWeight: "semibold", borderRadius: "lg", transition: "all 160ms ease" },
		},
		Input: {
			...defaultTheme.components.Input,
			variants: {
				...defaultTheme.components.Input.variants,
				filled: visibleFieldVariant,
			},
			defaultProps: { ...defaultTheme.components.Input.defaultProps, focusBorderColor: "mainorange" },
		},
		Select: {
			...defaultTheme.components.Select,
			variants: {
				...defaultTheme.components.Select.variants,
				filled: visibleFieldVariant,
			},
		},
		Textarea: {
			...defaultTheme.components.Textarea,
			variants: {
				...defaultTheme.components.Textarea.variants,
				filled: (props: any) => ({
					...visibleFieldVariant(props),
					field: { ...visibleFieldVariant(props).field, minHeight: "128px", paddingTop: "12px", paddingBottom: "12px" },
				}),
			},
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
