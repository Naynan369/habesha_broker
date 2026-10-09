import { useEffect, useState } from "react";

const useWindowPosition = () => {
	const [pos, setPos] = useState(0);

	useEffect(() => {
		const page = document.getElementById("pageContainer");
		if (!page) return;

		const updatePosition = () => setPos(page.scrollTop);
		page.addEventListener("scroll", updatePosition, { passive: true });
		updatePosition();
		return () => page.removeEventListener("scroll", updatePosition);
	}, []);

	return pos;
};

export { useWindowPosition };
