import Document, { Html, Head, Main, NextScript } from "next/document";
import { ColorModeScript } from "@chakra-ui/react";

class MyDocument extends Document {
	render() {
		return (
			<Html lang={this.props.locale || "en"}>
				<Head>
					<link
						rel="apple-touch-icon"
						sizes="512x512"
						href="/android-chrome-512x512.png"
					/>
					<link
						rel="icon"
						type="image/png"
						sizes="512x512"
						href="/android-chrome-512x512.png"
					/>
					<link rel="manifest" href="/site.webmanifest"></link>
					<link rel="preconnect" href="https://fonts.googleapis.com" />
					<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
					<link
						href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700;900&family=Noto+Sans+Ethiopic:wght@400;500;600;700;800;900&display=swap"
						rel="stylesheet"
					></link>
				</Head>
				<body>
					<ColorModeScript initialColorMode="light" />
					<Main />
					<NextScript />
				</body>
			</Html>
		);
	}
}

export default MyDocument;
