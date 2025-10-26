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
    <html lang="nl" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const settings = localStorage.getItem('app-settings');
                if (settings) {
                  const { theme } = JSON.parse(settings);
                  if (theme) {
                    document.documentElement.setAttribute('data-theme', theme);
                  }
                } else {
                  document.documentElement.setAttribute('data-theme', 'sunset');
                }
              } catch (e) {
                document.documentElement.setAttribute('data-theme', 'sunset');
              }
            `,
          }}
        />
      </head>
      <body className={`${poppins.variable} antialiased bg-base-100`}>
        <ThemeProvider>
          <ToastProvider>
            <div className="flex min-h-screen">
              <Navigation />
              <main className="flex-1 overflow-x-hidden">{children}</main>
            </div>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
