import { Box } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";

export const HomeMotionSystem = () => {
	const progress = useRef<HTMLDivElement>(null);

	useEffect(() => {
		let frame = 0;
		let observer: IntersectionObserver | undefined;
		const updateProgress = () => {
			if (frame) window.cancelAnimationFrame(frame);
			frame = window.requestAnimationFrame(() => {
				const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
				const value = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
				if (progress.current) progress.current.style.transform = "scaleX(" + value + ")";
			});
		};

		const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-home-reveal], [data-home-stagger]"));
		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		if ("IntersectionObserver" in window && !reducedMotion) {
			observer = new IntersectionObserver((entries) => {
				entries.forEach((entry) => {
					if (!entry.isIntersecting) return;
					entry.target.classList.add("home-motion-visible");
					observer?.unobserve(entry.target);
				});
			}, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });
		}
		targets.forEach((target) => {
			const bounds = target.getBoundingClientRect();
			const alreadyVisible = bounds.top < window.innerHeight * 0.92 && bounds.bottom > 0;
			if (alreadyVisible || reducedMotion || !observer) target.classList.add("home-motion-visible");
			else observer.observe(target);
		});
		document.documentElement.classList.add("home-motion-ready");
		updateProgress();
		window.addEventListener("scroll", updateProgress, { passive: true });
		window.addEventListener("resize", updateProgress);
		return () => {
			observer?.disconnect();
			document.documentElement.classList.remove("home-motion-ready");
			window.removeEventListener("scroll", updateProgress);
			window.removeEventListener("resize", updateProgress);
			if (frame) window.cancelAnimationFrame(frame);
		};
	}, []);

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
