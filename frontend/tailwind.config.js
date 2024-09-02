/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{js,jsx,ts,tsx}"],
	theme: {
		extend: {
			colors: {
				primary: "var(--color-bg-primary)",
				secondary: "var(--color-bg-secondary)",
				card: "var(--color-bg-card)",
				message: "var(--color-bg-message)",
				input: "var(--color-bg-input)",
				textPrimary: "var(--color-text-primary)",
				textSecondary: "var(--color-text-secondary)",
				accent: "var(--color-accent)",
				accentHover: "var(--color-accent-hover)",
				success: "var(--color-success)",
				danger: "var(--color-danger)",
				error: "var(--color-error)",
				border: "var(--color-border)",
				shadow: "var(--color-shadow)",
				admin: "var(--color-admin)",
			},
			fontFamily: {
				sans: "var(--font-family-sans)",
				mono: "var(--font-family-mono)",
			},
			borderRadius: {
				default: "var(--border-radius)",
			},
			boxShadow: {
				default: "var(--shadow-default)",
				focus: "0 0 0 3px var(--color-focus-shadow)",
			},
			zIndex: {
				card: "var(--z-index-card)",
			},
			transitionDuration: {
				default: "var(--transition-default)",
			},
			spacing: {
				unit: "var(--spacing-unit)",
			},
			width: {
				sidebar: "var(--sidebar-width)",
				userbar: "var(--userbar-width)",
				collapsed: "var(--collapsed-width)",
				account: "var(--account-width)",
				accountCollapsed: "var(--account-width-collapsed)",
				avatar: "var(--avatar-size)",
			},
		},
	},
	plugins: [],
};
