/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/components/**/*.{js,vue,ts}",
    "./app/layouts/**/*.vue",
    "./app/pages/**/*.vue",
    "./app/plugins/**/*.{js,ts}",
    "./app/app.vue",
    "./app/error.vue",
  ],
  theme: {
    extend: {
      colors: {
        pawbby: {
          primary: '#b39364',
          secondary: '#ddb67c',
          bg: '#201e1b',
          card: '#3a3f49',
          muted: '#cac8c5',
          mutedDark: '#6c6b69',
          brown: '#5d4534',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Or 'Outfit', 'Roboto'
      }
    },
  },
  plugins: [],
}
