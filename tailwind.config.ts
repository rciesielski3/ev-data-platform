const forest = {
  DEFAULT: "#0d2b22",
  50: "#f3f0e6",
  100: "#e6e2d2",
  200: "#c9cdbf",
  300: "#9fb0a5",
  400: "#6f8a7b",
  500: "#3f6a58",
  600: "#163d31",
  700: "#0d2b22",
  800: "#0a2119",
  900: "#081c16",
};

const sand = {
  50: "#fbf8f1",
  100: "#f6f1e7",
  200: "#ece5d3",
  300: "#d8cfb8",
  400: "#a3a594",
  500: "#5a665f",
  600: "#4f5e56",
  700: "#34463d",
  800: "#1d3329",
  900: "#0d2b22",
};

const amber = {
  50: "#fdf6ea",
  100: "#fbe9cc",
  200: "#f8d8a8",
  300: "#f5c47e",
  400: "#f2a65a",
  500: "#e08f3c",
  600: "#c27428",
  700: "#9a5a1e",
  800: "#6f4217",
  900: "#4a2c10",
};

/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        emerald: forest,
        sand,
        slate: sand,
        gray: sand,
        zinc: sand,
        amber,
        forest,
        cream: sand[100],
        paper: sand[50],
        sun: amber[400],
      },
    },
  },
  plugins: [],
};

export default config;
