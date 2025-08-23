import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "../contexts/ThemeContext";

const manrope = localFont({
  src: "../../public/Manrope-VariableFont_wght.ttf",
  variable: "--font-manrope",
  weight: "200 800",
  display: "swap",
});

export const metadata = {
  title: "Pinpoint",
  description: "A learning project in using the Mapbox API and more",
  icons: {
    icon: "/vite.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={manrope.variable}>
      <body className="font-manrope">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}