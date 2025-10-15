/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
        "*.{js,ts,jsx,tsx,mdx}"
    ],
  theme: {
    extend: {
      colors: {
        "zubo-primary": "#253347",
        "zubo-background": "#FBF9F6",
        "zubo-highlight-1": "#E7A79D",
        "zubo-highlight-2": "#B8835C",
        "zubo-accent": "#AAB89B",
        "zubo-text": "#2D2D2D",
      },
    },
  },
  plugins: [],
};
