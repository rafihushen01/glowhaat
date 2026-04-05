import "./globals.css";
import ReduxProvider from "./reduxprovider";
import {NextIntlClientProvider} from "next-intl";
import {getLocale, getMessages} from "next-intl/server";

export const metadata = {
  title: "KhanCosmetics",
  description:
    "KhanCosmetics is your ultimate destination for high-quality cosmetics and skincare products. We offer a wide range of beauty essentials, from makeup to skincare, all carefully curated to enhance your natural beauty. Our mission is to provide you with the best products that cater to your unique needs, ensuring you feel confident and radiant every day. Explore our collection and discover the perfect products to elevate your beauty routine.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ReduxProvider>{children}</ReduxProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
