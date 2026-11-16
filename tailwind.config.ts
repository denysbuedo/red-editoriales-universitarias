import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        slate: {
          50: "#F5F9FC",
          100: "#EDF3F7",
          200: "#E6EDF4",
          300: "#C8D5E0",
          400: "#9AAFC1",
          500: "#6E8598",
          600: "#4B6278",
          700: "#344B62",
          800: "#233D56",
          900: "#102B46",
          950: "#0C1D30",
        },
        blue: {
          50: "#EFF6FC",
          100: "#DDEBF8",
          200: "#B8D5F0",
          300: "#86B9E3",
          400: "#5797D2",
          500: "#2776C9",
          600: "#2268B4",
          700: "#1E5B9B",
          800: "#174A7F",
          900: "#123C65",
          950: "#0C1D30",
        },
        neutral: {
          50: "#F5F9FC",
          100: "#EDF3F7",
          200: "#E6EDF4",
          300: "#C8D5E0",
          400: "#9AAFC1",
          500: "#6E8598",
          600: "#4B6278",
          700: "#344B62",
          800: "#233D56",
          900: "#102B46",
          950: "#102B46",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      maxWidth: {
        "6xl": "1328px",
      },
    },
  },
  plugins: [],
};

export default config;
