import localFont from "next/font/local"

export const manrope = localFont({
    src: [
        {
            path: "../public/fonts/Manrope/static/Manrope-ExtraLight.ttf",
            weight: "200",
            style: "normal",
        },
        {
            path: "../public/fonts/Manrope/static/Manrope-Light.ttf",
            weight: "300",
            style: "normal",
        },
        {
            path: "../public/fonts/Manrope/static/Manrope-Regular.ttf",
            weight: "400",
            style: "normal",
        },
        {
            path: "../public/fonts/Manrope/static/Manrope-Medium.ttf",
            weight: "500",
            style: "normal",
        },
        {
            path: "../public/fonts/Manrope/static/Manrope-SemiBold.ttf",
            weight: "600",
            style: "normal",
        },
        {
            path: "../public/fonts/Manrope/static/Manrope-Bold.ttf",
            weight: "700",
            style: "normal",
        },
        {
            path: "../public/fonts/Manrope/static/Manrope-ExtraBold.ttf",
            weight: "800",
            style: "normal",
        },
    ],
    variable: "--font-manrope",
    display: "swap",
})
