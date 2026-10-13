import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "@config/theme";
import { generateDefaultSeo } from "next-seo/pages";
import Head from "next/head";
import NextNProgress from "nextjs-progressbar";
import "../styles/globals.scss";

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
	return (
		<ChakraProvider theme={theme}>
			<Head>
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
				<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
				{generateDefaultSeo({
					title: "Habesha Brokers",
					description: "Homes, vehicles, and business spaces across Ethiopia",
					openGraph: {
						siteName: "Habesha Brokers",
						title: "Habesha Brokers",
						description: "Homes, vehicles, and business spaces across Ethiopia",
						images: [{
							url: "/android-chrome-512x512.png",
							alt: "Habesha Brokers",
							width: 512,
							height: 512,
							type: "image/png",
						}],
					},
				})}
			</Head>
			<NextNProgress />
			<Component {...pageProps} />
		</ChakraProvider>
	);
}

export default MyApp;
