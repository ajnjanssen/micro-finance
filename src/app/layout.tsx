import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Navigation from "@/components/Navigation";
import { ToastProvider } from "@/components/ui/Toast";
import { ThemeProvider } from "@/components/ThemeProvider";

// ignore error for css import
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import "@/app/globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Micro Finance - Persoonlijke Financiën Manager",
  description: "Beheer je persoonlijke financiën met inzicht en overzicht",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" data-theme="sunset">
      <body className={`${poppins.variable} antialiased bg-base-100`}>
        <ThemeProvider>
          <ToastProvider>
            <div className="sticky top-0 z-50 bg-base-100 shadow-sm">
              <Navigation />
            </div>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
