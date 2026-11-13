import Document, { Html, Head, Main, NextScript } from "next/document";
import { ColorModeScript } from "@chakra-ui/react";
import { theme } from "@config/theme";

class MyDocument extends Document {
	render() {
		return (
			<Html lang={this.props.locale || "en"} data-scroll-behavior="smooth">
				<Head>
					<link rel="icon" type="image/svg+xml" href="/hb-monogram.svg" />
					<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
					<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
					<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
					<link rel="icon" href="/favicon.ico" />
					<link rel="manifest" href="/site.webmanifest" />
					<meta name="theme-color" content="#2b1e17" />
				</Head>
				<body>
					<ColorModeScript initialColorMode={theme.config.initialColorMode} />
					<Main />
					<NextScript />
				</body>
			</Html>
		);
	}
}

export default MyDocument;
