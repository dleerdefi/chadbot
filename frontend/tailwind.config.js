/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ["class"],
	content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
	theme: {
		extend: {
			colors: {
				primaryBg: "var(--color-bg-primary)",
				secondaryBg: "var(--color-bg-secondary)",
				cardBg: "var(--color-bg-card)",
				inputBg: "var(--color-bg-input)",
				customAccent: "var(--color-accent)",
				customBorder: "var(--color-border)",

				primary: {
					DEFAULT: "hsl(var(--primary))",
					foreground: "hsl(var(--primary-foreground))",
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary))",
					foreground: "hsl(var(--secondary-foreground))",
				},
				card: {
					DEFAULT: "hsl(var(--card))",
					foreground: "hsl(var(--card-foreground))",
				},
				message: "var(--color-bg-message)",
				input: "hsl(var(--input))",
				textPrimary: "var(--color-text-primary)",
				textSecondary: "var(--color-text-secondary)",
				accent: {
					DEFAULT: "hsl(var(--accent))",
					foreground: "hsl(var(--accent-foreground))",
				},
				accentHover: "var(--color-accent-hover)",
				success: "var(--color-success)",
				danger: "var(--color-danger)",
				error: "var(--color-error)",
				border: "hsl(var(--border))",
				shadow: "var(--color-shadow)",
				admin: "var(--color-admin)",
				adminSecondary: "var(--color-admin-secondary)",
				adminSecondaryHover: "var(--color-admin-secondary-hover)",
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				popover: {
					DEFAULT: "hsl(var(--popover))",
					foreground: "hsl(var(--popover-foreground))",
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive))",
					foreground: "hsl(var(--destructive-foreground))",
				},
				ring: "hsl(var(--ring))",
				chart: {
					1: "hsl(var(--chart-1))",
					2: "hsl(var(--chart-2))",
					3: "hsl(var(--chart-3))",
					4: "hsl(var(--chart-4))",
					5: "hsl(var(--chart-5))",
				},
			},
			fontFamily: {
				sans: "var(--font-family-sans)",
				mono: "var(--font-family-mono)",
			},
			borderRadius: {
				default: "var(--border-radius)",
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
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
	plugins: [require("tailwindcss-animate")],
};
