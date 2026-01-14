import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HouseRater - Find Your Perfect Home",
  description: "Rate and compare houses with your family to find the perfect home",
  openGraph: {
    title: "HouseRater - Find Your Perfect Home",
    description: "Make confident home-buying decisions together. Rate houses, set priorities, and compare scores with your household.",
    type: "website",
    siteName: "HouseRater",
  },
  twitter: {
    card: "summary",
    title: "HouseRater - Find Your Perfect Home",
    description: "Make confident home-buying decisions together. Rate houses, set priorities, and compare scores with your household.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
