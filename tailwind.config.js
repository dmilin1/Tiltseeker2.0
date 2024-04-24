/** @type {import('tailwindcss').Config} */
export default {
  content: ["./client/**/*.{html,css,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: '#242424',
        tint: '#363642',
        subtleTint: '#292933',
        buttonText: '#f1f1f1',
        text: '#ffffff',
        subtleText: '#d3d3d3',
        error: '#ef4444',
        redTeam: '#fa3232',
        blueTeam: '#2898fa',
      }
    },
  },
  plugins: [],
}

