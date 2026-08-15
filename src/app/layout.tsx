import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/NavBar";

export const metadata: Metadata = {
  title: "ChainLens — Supply Chain Resilience Graph",
  description:
    "Explore supplier dependencies and simulate disruptions on a graph database (CognoDB). See the blast radius of a supplier or region failure across every product.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5">
          <NavBar />
          <main className="flex-1 py-6">{children}</main>
          <footer className="border-t border-edge py-5 text-center text-xs text-subtle">
            ChainLens · backed by a graph database (CognoDB / openCypher over Bolt) ·
            built for the Wexa AI take-home
          </footer>
        </div>
      </body>
    </html>
  );
}
