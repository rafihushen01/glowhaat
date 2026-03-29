import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ReduxProvider from "./reduxprovider";   // 👈 import wrapper

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Rafi's World",
  description:
    "Best Online Mens Fashion Store in Bangladesh. Shop the latest trends in men's fashion.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ReduxProvider>
          {children}
        </ReduxProvider>
     
    
      </body>
    </html>
  );
}
