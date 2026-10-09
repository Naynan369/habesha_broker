import {
    theme as defaultTheme,
    ChakraTheme,
} from "@chakra-ui/react";

const config: ChakraTheme = {
    ...defaultTheme,
    fonts: {
        ...defaultTheme.fonts,
        heading: "Montserrat, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif",
        body: "Noto Sans JP, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif",
    },
    styles: {
        global: {
            "html, body": {
                color: "gray.800",
                background: "gray.50",
                minHeight: "100%",
            },
            "button, a": {
                WebkitTapHighlightColor: "transparent",
            },
            "::selection": {
                background: "#FCBF49",
                color: "#003049",
            },
        },
    },
    components: {
        ...defaultTheme.components,
        Button: {
            ...defaultTheme.components.Button,
            baseStyle: {
                ...defaultTheme.components.Button.baseStyle,
                fontWeight: "semibold",
                borderRadius: "lg",
                transition: "all 160ms ease",
            },
        },
        Input: {
            ...defaultTheme.components.Input,
            defaultProps: {
                ...defaultTheme.components.Input.defaultProps,
                focusBorderColor: "mainorange",
            },
        },
    },
    colors: {
        ...defaultTheme.colors,
        maingray: "#003049",
        mainred: "#D62828",
        mainorange: "#C66B36",
        mainyellow: "#E9B75C",
        mainlightYellow: "#EAE2B7",
    },
};

export const theme = config;
