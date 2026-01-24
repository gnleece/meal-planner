import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    // Category colors - background
    'bg-gray-200', 'bg-red-200', 'bg-orange-200', 'bg-amber-200', 'bg-yellow-200',
    'bg-lime-200', 'bg-green-200', 'bg-teal-200', 'bg-cyan-200', 'bg-sky-200',
    'bg-blue-200', 'bg-indigo-200', 'bg-violet-200', 'bg-purple-200', 'bg-pink-200', 'bg-rose-200',
    // Category colors - text
    'text-gray-800', 'text-red-900', 'text-orange-900', 'text-amber-900', 'text-yellow-900',
    'text-lime-900', 'text-green-900', 'text-teal-900', 'text-cyan-900', 'text-sky-900',
    'text-blue-900', 'text-indigo-900', 'text-violet-900', 'text-purple-900', 'text-pink-900', 'text-rose-900',
    // Category colors - ring
    'ring-gray-500', 'ring-red-500', 'ring-orange-500', 'ring-amber-500', 'ring-yellow-500',
    'ring-lime-500', 'ring-green-500', 'ring-teal-500', 'ring-cyan-500', 'ring-sky-500',
    'ring-blue-500', 'ring-indigo-500', 'ring-violet-500', 'ring-purple-500', 'ring-pink-500', 'ring-rose-500',
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        aubergine: {
          50: '#FCF9FA',   // background
          100: '#F6E9EF', // light accent (badges, active bg)
          200: '#E8D4DE', // hover states
          400: '#B8849A', // accent
          600: '#7A5068', // badge text
          700: '#4D2D42', // buttons
          800: '#3D2236', // button hover
          900: '#362032', // primary text
        },
      },
    },
  },
  plugins: [],
};
export default config;
