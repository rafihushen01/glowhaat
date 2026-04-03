import "./globals.css";
import "leaflet/dist/leaflet.css";
import ReduxProvider from "./reduxprovider";

export const metadata = {
  title: "KhanCosmetics",
  description:
    "KhanCosmetics is your ultimate destination for high-quality cosmetics and skincare products. We offer a wide range of beauty essentials, from makeup to skincare, all carefully curated to enhance your natural beauty. Our mission is to provide you with the best products that cater to your unique needs, ensuring you feel confident and radiant every day. Explore our collection and discover the perfect products to elevate your beauty routine.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
