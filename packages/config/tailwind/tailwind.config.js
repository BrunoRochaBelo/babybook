/** @type {import('tailwindcss').Config} */
const sharedConfig = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f8fbff",
          100: "#e0edff",
          400: "#5d8dee",
          500: "#3f6fd8",
          600: "#2d55b5"
        }
      }
    }
  },
  plugins: []
};

export default sharedConfig;
