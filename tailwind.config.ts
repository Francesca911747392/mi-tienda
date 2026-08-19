import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
      },
      fontFamily: {
        heading: "var(--font-heading)",
        body: "var(--font-body)",
      },
    },
  },
  plugins: [],
};
export default config;
