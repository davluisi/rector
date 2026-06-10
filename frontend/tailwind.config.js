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
        accentCyan: '#00F0FF',
        accentPink: '#FF2E93',
      }
    },
  },
  plugins: [],
}
