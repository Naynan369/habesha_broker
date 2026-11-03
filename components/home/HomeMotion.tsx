import { Box } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";

export const HomeMotionSystem = ({ showProgress = true }: { showProgress?: boolean }) => {
	const progress = useRef<HTMLDivElement>(null);

	useEffect(() => {
		let frame = 0;
		let observer: IntersectionObserver | undefined;
		let mutationObserver: MutationObserver | undefined;
		const selector = "[data-home-reveal], [data-home-stagger]";
		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const registeredTargets = new WeakSet<HTMLElement>();
		const revealedTargets = new WeakSet<HTMLElement>();
		const markVisible = (target: HTMLElement) => {
			revealedTargets.add(target);
			target.classList.add("home-motion-visible");
		};
		const updateProgress = () => {
			if (!showProgress) return;
			if (frame) window.cancelAnimationFrame(frame);
			frame = window.requestAnimationFrame(() => {
				const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
				const value = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
				if (progress.current) progress.current.style.transform = "scaleX(" + value + ")";
			});
		};

		if ("IntersectionObserver" in window && !reducedMotion) {
			observer = new IntersectionObserver((entries) => {
				entries.forEach((entry) => {
					if (!entry.isIntersecting) return;
					markVisible(entry.target as HTMLElement);
					observer?.unobserve(entry.target);
				});
			}, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });
		}

		const registerTarget = (target: HTMLElement) => {
			if (target.classList.contains("home-motion-visible") || registeredTargets.has(target)) return;
			const bounds = target.getBoundingClientRect();
			const alreadyVisible = bounds.top < window.innerHeight * 0.92 && bounds.bottom > 0;
			if (alreadyVisible || reducedMotion || !observer) {
				markVisible(target);
				return;
			}
			registeredTargets.add(target);
			observer.observe(target);
		};

		const registerNode = (node: Node) => {
			if (!(node instanceof HTMLElement)) return;
			if (node.matches(selector)) registerTarget(node);
			node.querySelectorAll<HTMLElement>(selector).forEach(registerTarget);
		};

		document.querySelectorAll<HTMLElement>(selector).forEach(registerTarget);
		if ("MutationObserver" in window) {
			mutationObserver = new MutationObserver((mutations) => {
				mutations.forEach((mutation) => {
					if (mutation.type === "childList") mutation.addedNodes.forEach(registerNode);
					if (mutation.type === "attributes" && mutation.target instanceof HTMLElement) {
						const target = mutation.target;
						if (revealedTargets.has(target) && !target.classList.contains("home-motion-visible")) markVisible(target);
					}
				});
			});
			mutationObserver.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
		}

		document.documentElement.classList.add("home-motion-ready");
		if (showProgress) {
			updateProgress();
			window.addEventListener("scroll", updateProgress, { passive: true });
			window.addEventListener("resize", updateProgress);
		}
		return () => {
			observer?.disconnect();
			mutationObserver?.disconnect();
			document.documentElement.classList.remove("home-motion-ready");
			if (showProgress) {
				window.removeEventListener("scroll", updateProgress);
				window.removeEventListener("resize", updateProgress);
			}
			if (frame) window.cancelAnimationFrame(frame);
		};
	}, [showProgress]);

	if (!showProgress) return null;

	return (
		<Box aria-hidden="true" position="fixed" top="0" left="0" right="0" h="2px" zIndex="1100" pointerEvents="none">
			<Box ref={progress} h="full" w="full" transform="scaleX(0)" transformOrigin="left center" bgGradient="linear(to-r, #be684a, #e9b75c, #f2d497)" boxShadow="0 0 12px rgba(233,183,92,.28)" />
		</Box>
	);
};

export const HomeReveal = ({ children, delay = 0 }: { children: ReactNode; delay?: number }) => (
	<div data-home-reveal style={{ "--home-reveal-delay": delay + "ms" } as CSSProperties}>
		{children}
	</div>
);
