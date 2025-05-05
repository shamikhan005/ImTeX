import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./styles/noise.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ImTeX - Image to LaTeX Converter",
  description: "Convert images to LaTeX with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-black min-h-screen relative`}>
        <div className="noise" aria-hidden="true" />
        <header className="border-b border-gray-200 bg-white relative z-10">
          <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div>
              <h1 className="text-2xl font-bold">ImTeX</h1>
              <p className="mt-2 text-sm text-gray-500">Image to LaTeX Converter</p>
            </div>
          </div>
        </header>
        <main className="container mx-auto py-12 px-4 sm:px-6 lg:px-8 relative z-10">
          {children}
        </main>
        <footer className="border-t border-gray-200 bg-white py-6 relative z-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500">
              ImTeX - Convert images to LaTeX
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}