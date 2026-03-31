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
  title: "KhanCosmetics",
  description:
    "KhanCosmetics is your ultimate destination for high-quality cosmetics and skincare products. We offer a wide range of beauty essentials, from makeup to skincare, all carefully curated to enhance your natural beauty. Our mission is to provide you with the best products that cater to your unique needs, ensuring you feel confident and radiant every day. Explore our collection and discover the perfect products to elevate your beauty routine.",
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
