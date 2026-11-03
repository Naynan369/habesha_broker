import {
	Box, Button, Divider, Flex, Modal, ModalBody, ModalCloseButton, ModalContent,
	ModalHeader, ModalOverlay, Spinner, Text, useColorModeValue, useToast,
	type ButtonProps,
} from "@chakra-ui/react";
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
const pendingNonces = new Map<Provider, Promise<string>>();

function getNonce(provider: Provider) {
	const pending = pendingNonces.get(provider);
	if (pending) return pending;
	// Strict Mode can mount twice. Share only the in-flight request so two
	// Set-Cookie responses cannot overwrite the challenge used by the dialog.
	const request = axios.get("/api/auth/provider/nonce", { params: { provider }, timeout: 10000 })
		.then((response) => String(response.data?.nonce || ""))
		.finally(() => { if (pendingNonces.get(provider) === request) pendingNonces.delete(provider); });
	pendingNonces.set(provider, request);
	return request;
}

async function sha256Hex(value: string) {
	const digest = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
	return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

// Keep Google's genuine control in the dialog; the two entry buttons use our own
// shared styles and translations. Never hide an iframe over a custom button.
function GoogleSignInControl({ locale, attempt, loadingLabel, onCredential, onError }: {
	locale: string;
	attempt: number;
	loadingLabel: string;
	onCredential: (identityToken: string, nonce: string) => void;
	onError: () => void;
}) {
	const mountRef = useRef<HTMLDivElement>(null);
	const [ready, setReady] = useState(false);
	const theme = useColorModeValue("outline", "filled_black");

	useEffect(() => {
		const mount = mountRef.current;
		if (!mount) return;
		let cancelled = false;
		let observer: ResizeObserver | undefined;
		let frame = 0;
		let lastWidth = 0;
		setReady(false);

		const initialize = async () => {
			try {
				const nonce = await getNonce("google");
				if (cancelled) return;
				const google = window.google?.accounts?.id;
				if (!google || !nonce) throw new Error("Google sign-in is unavailable");
				google.initialize({
					client_id: googleClientId,
					nonce,
					callback: (result: { credential?: string }) => {
						if (cancelled) return;
						if (result?.credential) onCredential(result.credential, nonce);
						else onError();
					},
				});
				const render = () => {
					const width = Math.min(400, Math.floor(mount.clientWidth));
					if (cancelled || width < 1 || width === lastWidth) return;
					lastWidth = width;
					mount.replaceChildren();
					google.renderButton(mount, {
						type: "standard", theme, size: "large", text: "continue_with",
						shape: "pill", logo_alignment: "left", locale, width: String(width),
					});
					setReady(true);
				};
				render();
				observer = new ResizeObserver(() => {
					cancelAnimationFrame(frame);
					frame = requestAnimationFrame(render);
				});
				observer.observe(mount);
			} catch {
				if (!cancelled) onError();
			}
		};
		void initialize();
		return () => {
			cancelled = true;
			observer?.disconnect();
			cancelAnimationFrame(frame);
			mount.replaceChildren();
		};
	}, [attempt, locale, onCredential, onError, theme]);

	return (
		<Box w="full" minH="48px" aria-busy={!ready}>
			{!ready && <Flex role="status" align="center" justify="center" gap="3" py="3"><Spinner size="sm" /><Text fontSize="sm">{loadingLabel}</Text></Flex>}
			<Box ref={mountRef} w="full" />
		</Box>
	);
}

export function SocialAuthButtons({ mode, termsAccepted = false }: Props) {
	const lang = useLang();
	const router = useRouter();
	const googleLocale = router.locale === "am" ? "am" : "en";
	const toast = useToast();
	const setUser = useUser((state) => state.setUser);
	const signInPendingRef = useRef(false);
	const [googleScriptLocale, setGoogleScriptLocale] = useState<string | null>(null);
	const [googleScriptError, setGoogleScriptError] = useState(false);
	const [googleDialogOpen, setGoogleDialogOpen] = useState(false);
	const [googleRenderError, setGoogleRenderError] = useState(false);
	const [appleScriptReady, setAppleScriptReady] = useState(false);
	const [googleAttempt, setGoogleAttempt] = useState(0);
	const [busyProvider, setBusyProvider] = useState<Provider | null>(null);
	const [appleOriginAllowed, setAppleOriginAllowed] = useState(false);
	const muted = useColorModeValue("gray.600", "gray.300");
	const buttonBg = useColorModeValue("#62666d", "#4b4f56");
	const buttonHover = useColorModeValue("#53575e", "#5b6068");
	const buttonBorder = useColorModeValue("#565b63", "#6b717b");
	const dialogBg = useColorModeValue("white", "#17191c");
	const focusRing = useColorModeValue("#143a45", "#e9b75c");
	const googleScriptReady = googleScriptLocale === googleLocale;
	const canContinue = mode === "login" || termsAccepted;
	const sharedButtonProps: ButtonProps = {
		type: "button", variant: "unstyled", w: "full", h: "48px", minH: "48px",
		display: "grid", gridTemplateColumns: "24px minmax(0, 1fr) 24px", gap: "2",
		alignItems: "center", px: "4", borderRadius: "12px", border: "1px solid",
		borderColor: buttonBorder, bg: buttonBg, color: "white", fontFamily: "body",
		fontSize: "15px", fontWeight: 700, lineHeight: "1.4", opacity: 1,
		transition: "background-color 160ms ease, box-shadow 160ms ease",
		_hover: { bg: buttonHover, color: "white" },
		_active: { bg: buttonHover, color: "white" },
		_focusVisible: { outline: "2px solid", outlineColor: focusRing, outlineOffset: "3px" },
		_disabled: { opacity: 1, bg: buttonBg, color: "white", cursor: "not-allowed" },
	};

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
		if (signInPendingRef.current) return;
		signInPendingRef.current = true;
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
			setGoogleDialogOpen(false);
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
			signInPendingRef.current = false;
			setBusyProvider(null);
			if (provider === "google") setGoogleAttempt((attempt) => attempt + 1);
		}
	}, [lang.auth, mode, router, setUser, termsAccepted, toast]);

	const handleGoogleCredential = useCallback((identityToken: string, nonce: string) => {
		void completeSignIn("google", identityToken, nonce);
	}, [completeSignIn]);
	const handleGoogleError = useCallback(() => setGoogleRenderError(true), []);
	const closeGoogleDialog = () => {
		if (busyProvider !== "google") setGoogleDialogOpen(false);
	};

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
			{googleClientId && <Script
				key={googleLocale}
				src={`https://accounts.google.com/gsi/client?hl=${googleLocale}`}
				strategy="afterInteractive"
				onReady={() => { setGoogleScriptLocale(googleLocale); setGoogleScriptError(false); }}
				onError={() => setGoogleScriptError(true)}
			/>}
			{appleServiceId && <Script src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js" strategy="afterInteractive" onReady={() => setAppleScriptReady(true)} />}
			<Flex align="center" gap="4" my="7" aria-hidden="true">
				<Divider />
				<Text flexShrink={0} fontSize="xs" color={muted} fontWeight="semibold" textTransform="uppercase" letterSpacing=".08em">
					{lang.auth.social_divider}
				</Text>
				<Divider />
			</Flex>
			<Flex direction="column" w="full" maxW="400px" mx="auto" gap="3" lang={googleLocale}>
				<Button
					{...sharedButtonProps}
					isDisabled={!googleClientId || !canContinue || busyProvider !== null}
					aria-haspopup="dialog"
					aria-busy={busyProvider === "google"}
					onClick={() => { setGoogleRenderError(false); setGoogleDialogOpen(true); }}
				>
					<Box as="span" display="flex" justifyContent="center" aria-hidden="true"><FcGoogle size={21} /></Box>
					<Text as="span" fontWeight="inherit" whiteSpace="nowrap">{lang.auth.continue_google}</Text>
					<Box as="span" aria-hidden="true">{busyProvider === "google" && <Spinner size="xs" />}</Box>
				</Button>
				<Button
					{...sharedButtonProps}
					isDisabled={!appleServiceId || !appleRedirectUri || !appleOriginAllowed || !appleScriptReady || !canContinue || busyProvider !== null}
					aria-busy={busyProvider === "apple"}
					onClick={() => void signInWithApple()}
				>
					<Box as="span" display="flex" justifyContent="center" aria-hidden="true"><FaApple size={21} /></Box>
					<Text as="span" fontWeight="inherit" whiteSpace="nowrap">{lang.auth.continue_apple}</Text>
					<Box as="span" aria-hidden="true">{busyProvider === "apple" && <Spinner size="xs" />}</Box>
				</Button>
				{(!googleClientId || !appleServiceId) && (
					<Text fontSize="xs" textAlign="center" color={muted} lineHeight="1.6">
						{!googleClientId && !appleServiceId
							? lang.auth.social_setup
							: !googleClientId ? lang.auth.social_google_unavailable : lang.auth.social_apple_unavailable}
					</Text>
				)}
				{appleServiceId && appleRedirectUri && !appleOriginAllowed && (
					<Text fontSize="xs" textAlign="center" color={muted} lineHeight="1.6">
						{lang.auth.social_apple_domain}
					</Text>
				)}
			</Flex>
			<Modal
				isOpen={googleDialogOpen}
				onClose={closeGoogleDialog}
				isCentered
				closeOnEsc={busyProvider !== "google"}
				closeOnOverlayClick={busyProvider !== "google"}
			>
				<ModalOverlay />
				<ModalContent bg={dialogBg} borderRadius="20px" w="calc(100% - 32px)" maxW="448px" lang={googleLocale}>
					<ModalHeader pr="14" fontSize="lg" fontWeight="700">{lang.auth.continue_google}</ModalHeader>
					<ModalCloseButton aria-label={lang.auth.social_close} isDisabled={busyProvider === "google"} />
					<ModalBody pb="6">
						<Text color={muted} fontSize="sm" lineHeight="1.7" mb="5">{lang.auth.google_dialog_description}</Text>
						{busyProvider === "google" && <Flex role="status" align="center" justify="center" gap="3" minH="48px"><Spinner size="sm" /><Text fontSize="sm">{lang.auth.authenticating}</Text></Flex>}
						<Box display={busyProvider === "google" ? "none" : "block"}>
							{googleScriptError ? (
								<Text role="alert" color={muted} fontSize="sm">{lang.auth.social_load_failed}</Text>
							) : googleRenderError ? (
								<Flex direction="column" gap="4">
									<Text role="alert" fontSize="sm">{lang.auth.social_auth_failed}</Text>
									<Button {...sharedButtonProps} display="flex" onClick={() => { setGoogleRenderError(false); setGoogleAttempt((attempt) => attempt + 1); }}>{lang.auth.social_retry}</Button>
								</Flex>
							) : googleScriptReady ? (
								<GoogleSignInControl
									locale={googleLocale}
									attempt={googleAttempt}
									loadingLabel={lang.auth.social_loading}
									onCredential={handleGoogleCredential}
									onError={handleGoogleError}
								/>
							) : (
								<Flex role="status" align="center" justify="center" gap="3" minH="48px"><Spinner size="sm" /><Text fontSize="sm">{lang.auth.social_loading}</Text></Flex>
							)}
						</Box>
					</ModalBody>
				</ModalContent>
			</Modal>
		</>
	);
}
