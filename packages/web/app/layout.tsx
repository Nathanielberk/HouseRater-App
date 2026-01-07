import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HouseRater - Find Your Perfect Home",
  description: "Rate and compare houses with your family to find the perfect home",
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
