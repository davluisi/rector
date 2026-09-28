/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        premiumDark: '#0E0E10',
        cardDark: '#18181C',
        borderDark: '#282830',
        inputDark: '#1C1C1E',
        inputBorder: '#2C2C2E',
        // Rector Brand Identity
        rectorRed: '#A0132C',
        rectorYellow: '#FFB430',
        // Accent mappings: replaced Cyan and Pink with Yellow and Red
        accentYellow: '#FFB430',
        accentRed: '#A0132C',
        accentCyan: '#FFB430', // mapped to brand yellow for full theme consistency
        accentPink: '#A0132C', // mapped to brand red for full theme consistency
      }
    },
  },
  plugins: [],
}
