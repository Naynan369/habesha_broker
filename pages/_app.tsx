import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "@config/theme";
import { DefaultSeo, NextSeo } from "next-seo";
import NextNProgress from "nextjs-progressbar";
import "../styles/globals.scss";

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
	return (
		<ChakraProvider theme={theme}>
			<DefaultSeo
				title="Habesha Brokers"
				description="Homes, vehicles, and business spaces across Ethiopia"
				openGraph={{
					url: process.env.DOMAIN,
					siteName: "Habesha Brokers",
					title: "Habesha Brokers",
					description: "Homes, vehicles, and business spaces across Ethiopia",
					images: [
						{
							url: "/assets/images/brand-mark.svg",
							alt: "Habesha Brokers",
							width: 800,
							height: 600,
							type: "image/svg+xml",
						},
					],
				}}
			/>
			<NextNProgress />
			<Component {...pageProps} />
		</ChakraProvider>
	);
}

export default MyApp;
