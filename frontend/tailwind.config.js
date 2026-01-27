/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{html,ts}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#EF476F',
                    50: '#FEF2F4',
                    100: '#FDE5E9',
                    200: '#FBCBD4',
                    300: '#F79AB0',
                    400: '#F3698B',
                    500: '#EF476F',
                    600: '#D63F5F',
                    700: '#A73149',
                    800: '#782333',
                    900: '#49151E',
                },
                sidebar: {
                    bg: '#2B2D42',
                    text: '#FFFFFF',
                    muted: '#A8AAB8',
                    active: '#EF476F',
                },
                status: {
                    present: '#06D6A0',
                    absent: '#EF476F',
                    late: '#FFB703',
                },
            },
        },
    },
    plugins: [],
}
