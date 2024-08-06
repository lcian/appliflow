import { cn } from "@/lib/utils";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-sans",
});

export const metadata: Metadata = {
    title: "appliflow",
    description: "Track and visualize your job applications",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"
                />
            </head>
            <body
                className={cn(
                    "bg-background text-foreground w-screen min-h-screen",
                    inter.variable,
                )}
            >
                <Providers>{children}</Providers>
                <SpeedInsights />
            </body>
        </html>
    );
}
