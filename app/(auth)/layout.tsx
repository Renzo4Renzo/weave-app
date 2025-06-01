import "../globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";

export const metadata = {
  title: "Weaves",
  description: "A Next.js text-based conversation app",
};

const interFont = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${interFont.className} bg-dark-1`}>
          <h1>Ay!</h1>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
