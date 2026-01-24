import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    // Category colors - background
    'bg-gray-100', 'bg-red-100', 'bg-orange-100', 'bg-amber-100', 'bg-yellow-100',
    'bg-lime-100', 'bg-green-100', 'bg-teal-100', 'bg-cyan-100', 'bg-sky-100',
    'bg-blue-100', 'bg-indigo-100', 'bg-violet-100', 'bg-purple-100', 'bg-pink-100', 'bg-rose-100',
    // Category colors - text
    'text-gray-800', 'text-red-800', 'text-orange-800', 'text-amber-800', 'text-yellow-800',
    'text-lime-800', 'text-green-800', 'text-teal-800', 'text-cyan-800', 'text-sky-800',
    'text-blue-800', 'text-indigo-800', 'text-violet-800', 'text-purple-800', 'text-pink-800', 'text-rose-800',
    // Category colors - ring
    'ring-gray-400', 'ring-red-400', 'ring-orange-400', 'ring-amber-400', 'ring-yellow-400',
    'ring-lime-400', 'ring-green-400', 'ring-teal-400', 'ring-cyan-400', 'ring-sky-400',
    'ring-blue-400', 'ring-indigo-400', 'ring-violet-400', 'ring-purple-400', 'ring-pink-400', 'ring-rose-400',
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
