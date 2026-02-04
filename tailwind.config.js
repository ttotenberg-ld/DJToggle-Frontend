/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#0a0a0c",
                surface: "#1a1a1e",
                primary: "#6d28d9", // Purple
                secondary: "#db2777", // Pink
                accent: "#22d3ee", // Cyan
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
