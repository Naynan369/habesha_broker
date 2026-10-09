import { useEffect, useState } from "react";

const useWindowPosition = () => {
	const [pos, setPos] = useState(0);

	useEffect(() => {
		const page = document.getElementById("pageContainer");
		const updatePosition = () => setPos(window.scrollY || document.documentElement.scrollTop || page?.scrollTop || 0);
		window.addEventListener("scroll", updatePosition, { passive: true });
		page?.addEventListener("scroll", updatePosition, { passive: true });
		updatePosition();
		return () => {
			window.removeEventListener("scroll", updatePosition);
			page?.removeEventListener("scroll", updatePosition);
		};
	}, []);

	return pos;
};

export { useWindowPosition };
