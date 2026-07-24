import type { Metadata } from "next";
import { Ubuntu, Open_Sans } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const ubuntu = Ubuntu({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-ubuntu", display: "swap" });
const openSans = Open_Sans({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-opensans", display: "swap" });

export const metadata: Metadata = {
  title: "Ciloglu Rechnungsprüfer",
  description: "Rechnungseingangsprüfung für Ciloglu Handels GmbH",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${ubuntu.variable} ${openSans.variable}`}>
      <body>
        <div className="app-shell">
          <Sidebar />
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
