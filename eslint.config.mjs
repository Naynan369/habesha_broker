import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
	...nextVitals,
	{
		rules: {
			// API and route synchronization effects intentionally set loading state.
			"react-hooks/set-state-in-effect": "off",
		},
	},
	globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
