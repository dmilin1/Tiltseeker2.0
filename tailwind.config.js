/** @type {import('tailwindcss').Config} */
export default {
  content: ["./client/**/*.{html,css,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: '#242424',
        tint: '#363642',
        buttonText: '#f1f1f1',
        text: '#ffffff',
      }
    },
  },
  plugins: [],
}

