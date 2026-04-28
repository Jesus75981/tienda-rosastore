export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kitty: {
          pink: '#FF69B4', // Hot pink
          light: '#FFF0F5', // Lavender blush (very light pink)
          cream: '#FFF9F9', // Off-white cream for backgrounds
          rose: '#F472B6', // Rose pink
          dark: '#9F1239', // Dark red for accents
        }
      }
    },
  },
  plugins: [],
}
