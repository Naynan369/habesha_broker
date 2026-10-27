import { theme as defaultTheme, ChakraTheme } from "@chakra-ui/react";
import { mode } from "@chakra-ui/theme-tools";

const visibleFieldVariant = (props: any) => {
	const background = mode("white", "#0c0c0c")(props);
	const borderColor = mode("#929fa3", "whiteAlpha.400")(props);
	const hoverBorderColor = mode("#5f7075", "whiteAlpha.600")(props);
	return {
		field: {
			background,
			color: mode("#25383d", "#e8eff0")(props),
			border: "1px solid",
			borderColor,
			borderRadius: "xl",
			transition: "background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease",
			_placeholder: { color: mode("#5b6a70", "#aebdc1")(props), opacity: 1 },
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
		heading: "var(--font-space-grotesk), var(--font-noto-sans-ethiopic), 'Kefa III', Kefa, Avenir Next, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
		body: "var(--font-space-grotesk), var(--font-noto-sans-ethiopic), 'Kefa III', Kefa, 'Noto Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
	},
	styles: {
		global: (props) => ({
			":root": {
				colorScheme: mode("light", "dark")(props),
			},
			"html, body, #__next": {
				color: mode("#25383d", "#e8eff0")(props),
				background: mode("#f5f5f1", "#000000")(props),
				minHeight: "100%",
				transition: "background-color 180ms ease, color 180ms ease",
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
				filled: (props: any) => {
					return { ...visibleFieldVariant(props).field, minHeight: "160px", lineHeight: 1.65, padding: "14px 16px", resize: "vertical" };
				},
			},
		},
		Checkbox: {
			...defaultTheme.components.Checkbox,
			baseStyle: (props: any) => ({
				control: {
					bg: mode("white", "#0c0c0c")(props),
					borderColor: mode("#68777c", "whiteAlpha.600")(props),
					borderWidth: "2px",
					borderRadius: "sm",
					_hover: { borderColor: mode("#34484e", "whiteAlpha.800")(props) },
					_checked: {
						bg: "mainorange",
						borderColor: "mainorange",
						color: "white",
						_hover: { bg: "#ad5626", borderColor: "#ad5626" },
					},
					_focusVisible: { boxShadow: "0 0 0 3px rgba(198, 107, 54, .28)" },
				},
				label: { color: mode("#25383d", "#e8eff0")(props) },
			}),
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
