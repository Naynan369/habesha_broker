import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "@config/theme";
import { generateDefaultSeo } from "next-seo/pages";
import Head from "next/head";
import NextNProgress from "nextjs-progressbar";
import "../styles/globals.scss";

function MyApp({ Component, pageProps }) {
	return (
		<ChakraProvider theme={theme}>
			<Head>
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
