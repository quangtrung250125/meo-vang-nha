/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./Chi/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#10B981', 
        secondary: '#059669', 
        accent: '#FF9B71', 
        'accent-hover': '#FF8252',
        'primary-light': '#D1FAE5',
        'bg-cream': '#FDFBF7',
        'bg-beige': '#F3EFE6',
        'text-dark': '#1e293b',
        'text-light': '#f8fafc',
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
        title: ['Montserrat', 'sans-serif'],
        subtitle: ['Raleway', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
