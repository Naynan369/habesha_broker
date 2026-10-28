import { Box, Button, Divider, Flex, Spinner, Text, useColorModeValue, useToast } from "@chakra-ui/react";
import { useLang } from "@libs/hooks/useLang";
import { useUser } from "@libs/store";
import axios from "axios";
import Script from "next/script";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaApple } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

declare global {
	interface Window {
		google?: any;
		AppleID?: any;
	}
}

type Provider = "google" | "apple";
type Props = {
	mode: "login" | "signup";
	termsAccepted?: boolean;
};

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || "";
const appleServiceId = process.env.NEXT_PUBLIC_APPLE_SERVICE_ID?.trim() || "";
const appleRedirectUri = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI?.trim() || "";

async function getNonce(provider: Provider) {
	const response = await axios.get("/api/auth/provider/nonce", { params: { provider } });
	return String(response.data?.nonce || "");
}

async function sha256Hex(value: string) {
	const digest = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
	return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function SocialAuthButtons({ mode, termsAccepted = false }: Props) {
	const lang = useLang();
	const router = useRouter();
	const toast = useToast();
	const setUser = useUser((state) => state.setUser);
	const googleButtonRef = useRef<HTMLDivElement>(null);
	const [googleScriptReady, setGoogleScriptReady] = useState(false);
	const [appleScriptReady, setAppleScriptReady] = useState(false);
	const [googleAttempt, setGoogleAttempt] = useState(0);
	const [busyProvider, setBusyProvider] = useState<Provider | null>(null);
	const [appleOriginAllowed, setAppleOriginAllowed] = useState(false);
	const muted = useColorModeValue("gray.600", "gray.300");
	const googlePlaceholderBg = useColorModeValue("white", "white");
	const canContinue = mode === "login" || termsAccepted;

	useEffect(() => {
		if (!appleRedirectUri) {
			setAppleOriginAllowed(false);
			return;
		}
		try {
			const redirect = new URL(appleRedirectUri);
			setAppleOriginAllowed(redirect.protocol === "https:" && redirect.origin === window.location.origin);
		} catch {
			setAppleOriginAllowed(false);
		}
	}, []);

	const completeSignIn = useCallback(async (provider: Provider, identityToken: string, nonce: string, fullName?: unknown) => {
		setBusyProvider(provider);
		try {
			const response = await axios.post("/api/auth/provider", {
				provider,
				identityToken,
				nonce,
				clientType: "web",
				createAccount: mode === "signup",
				termsAccepted: mode === "signup" && termsAccepted,
				fullName,
			});
			const user = response.data.user;
			setUser(user);
			const destination = user.role === "ADMIN" ? "/admin" : "/dashboard";
			await router.replace(destination, destination, { locale: router.locale });
		} catch (error: any) {
			let description = lang.auth.social_auth_failed;
			if (error?.response?.status === 404 && mode === "login") description = lang.auth.social_account_missing;
			else if (error?.response?.status === 503) description = lang.auth.social_setup;
			else if (error?.response?.status === 400 && mode === "signup" && !termsAccepted) description = lang.auth.social_terms_required;
			toast({
				title: lang.auth.error_title,
				description,
				status: "error",
				isClosable: true,
			});
		} finally {
			setBusyProvider(null);
			if (provider === "google") setGoogleAttempt((attempt) => attempt + 1);
		}
	}, [lang.auth, mode, router, setUser, termsAccepted, toast]);

	useEffect(() => {
		if (!googleClientId || !googleScriptReady || !canContinue || !googleButtonRef.current) return;
		let cancelled = false;
		const mountGoogleButton = async () => {
			try {
				const nonce = await getNonce("google");
				const google = window.google;
				if (cancelled || !google?.accounts?.id || !googleButtonRef.current) return;
				google.accounts.id.initialize({
					client_id: googleClientId,
					nonce,
					callback: (result: { credential?: string }) => {
						if (result?.credential) void completeSignIn("google", result.credential, nonce);
						else {
							toast({ title: lang.auth.error_title, description: lang.auth.social_auth_failed, status: "error", isClosable: true });
							setGoogleAttempt((attempt) => attempt + 1);
						}
					},
				});
				const mount = googleButtonRef.current;
				mount.replaceChildren();
				google.accounts.id.renderButton(mount, {
					type: "standard",
					theme: "outline",
					size: "large",
					text: "continue_with",
					shape: "rectangular",
					logo_alignment: "left",
					width: Math.max(240, Math.floor(mount.getBoundingClientRect().width)),
				});
			} catch {
				if (!cancelled) toast({ title: lang.auth.error_title, description: lang.auth.social_auth_failed, status: "error", isClosable: true });
			}
		};
		void mountGoogleButton();
		return () => { cancelled = true; };
	}, [canContinue, completeSignIn, googleAttempt, googleScriptReady, lang.auth, toast]);

	const signInWithApple = async () => {
		if (!appleServiceId || !appleRedirectUri || !appleOriginAllowed || !appleScriptReady || !canContinue || busyProvider) return;
		try {
			setBusyProvider("apple");
			const nonce = await getNonce("apple");
			const AppleID = window.AppleID;
			if (!AppleID?.auth) throw new Error("Apple sign-in did not load");
			AppleID.auth.init({
				clientId: appleServiceId,
				scope: "name email",
				redirectURI: appleRedirectUri,
				state: nonce,
				nonce: await sha256Hex(nonce),
				usePopup: true,
			});
			const result = await AppleID.auth.signIn();
			if (result?.authorization?.state !== nonce || !result?.authorization?.id_token) {
				throw new Error("Apple could not verify this sign-in");
			}
			await completeSignIn("apple", result.authorization.id_token, nonce, result.user?.name);
		} catch (error: any) {
			const cancelled = error?.error === "user_cancelled_authorize" || error?.message === "user_cancelled_authorize";
			if (!cancelled) {
				toast({ title: lang.auth.error_title, description: lang.auth.social_auth_failed, status: "error", isClosable: true });
			}
			setBusyProvider(null);
		}
	};

	return (
		<>
			{googleClientId && <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => setGoogleScriptReady(true)} />}
			{appleServiceId && <Script src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js" strategy="afterInteractive" onReady={() => setAppleScriptReady(true)} />}
			<Flex align="center" gap="4" my="7" aria-hidden="true">
				<Divider />
				<Text flexShrink={0} fontSize="xs" color={muted} fontWeight="semibold" textTransform="uppercase" letterSpacing=".08em">
					{lang.auth.social_divider}
				</Text>
				<Divider />
			</Flex>
			<Flex direction="column" gap="3">
				{googleClientId && canContinue && googleScriptReady ? (
					<Box ref={googleButtonRef} w="full" minH="44px" sx={{ "& iframe": { maxWidth: "100%" } }} />
				) : (
					<Button
						type="button"
						w="full"
						h="48px"
						borderRadius="xl"
						border="1px solid"
						borderColor="gray.300"
						bg={googlePlaceholderBg}
						color="gray.800"
						leftIcon={<FcGoogle />}
						isDisabled={!googleClientId || !canContinue || busyProvider !== null}
						isLoading={Boolean(googleClientId && canContinue && !googleScriptReady)}
					>
						{lang.auth.continue_google}
					</Button>
				)}
				<Button
					type="button"
					w="full"
					h="48px"
					borderRadius="xl"
					bg="#000000"
					color="white"
					leftIcon={<FaApple />}
					_hover={{ bg: "#1b1b1b" }}
					_active={{ bg: "#2a2a2a" }}
					isLoading={busyProvider === "apple"}
					isDisabled={!appleServiceId || !appleRedirectUri || !appleOriginAllowed || !appleScriptReady || !canContinue || (busyProvider !== null && busyProvider !== "apple")}
					onClick={() => void signInWithApple()}
				>
					{lang.auth.continue_apple}
				</Button>
				{(!googleClientId || !appleServiceId) && (
					<Text fontSize="xs" textAlign="center" color={muted} lineHeight="1.6">
						{lang.auth.social_setup}
					</Text>
				)}
				{appleServiceId && appleRedirectUri && !appleOriginAllowed && (
					<Text fontSize="xs" textAlign="center" color={muted} lineHeight="1.6">
						{lang.auth.social_apple_domain}
					</Text>
				)}
			</Flex>
		</>
	);
}
