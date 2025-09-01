import { Manrope } from "next/font/google";
import "@/globals/globals.css";
import { ThemeProvider } from "../contexts/ThemeContext";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Pinpoint",
  description: "A learning project in using the Mapbox API and more",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={manrope.className}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
