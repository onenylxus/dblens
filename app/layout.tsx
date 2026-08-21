import { cn } from "@/lib/utils";
import { Geist } from "next/font/google";
import type { Metadata } from "next";
import Package from '@/package.json' with { type: 'json' };
import "./globals.css";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: Package.name,
  description: Package.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html className={cn("font-sans", geist.variable)}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
