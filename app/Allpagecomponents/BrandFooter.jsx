import Image from "next/image";
import { Facebook, Instagram, MessageCircle } from "lucide-react";
import khancoslogo from "../../public/khancosmeticslogo.png";
import { Link } from "@/i18n/navigation";

const xIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
    <path d="M18.9 2H22l-6.77 7.74L23 22h-6.1l-4.78-6.25L6.65 22H3.52l7.24-8.28L1 2h6.26l4.32 5.71L18.9 2Zm-1.07 18.13h1.69L6.34 3.77H4.52l13.31 16.36Z" />
  </svg>
);

const shopLinks = [
  { label: "Makeup", href: "/#shop-by-category" },
  { label: "Skin", href: "/#shop-by-category" },
  { label: "Eye Care", href: "/#shop-by-category" },
  { label: "Hair", href: "/#shop-by-category" },
  { label: "Personal Care", href: "/#shop-by-category" },
  { label: "Natural", href: "/#shop-by-category" },
  { label: "Mom & Baby", href: "/#shop-by-category" },
];

const quickLinks = [
  { label: "Offers", href: "/#deals-you-cant-miss" },
  { label: "Mens Products", href: "/#shop-by-category" },
  { label: "Skin Concerns", href: "/#shop-by-category" },
  { label: "New Arrival", href: "/#new-arrivals" },
  { label: "Makeup", href: "/#shop-by-category" },
];

const beautyLinks = [
  { label: "Know Your Routine", href: "/#beauty-journal" },
  { label: "Hair Care 101", href: "/#beauty-journal" },
  { label: "Skin Care 101", href: "/#beauty-journal" },
  { label: "Makeup 101", href: "/#beauty-journal" },
];

const helpLinks = [
  { label: "Contact Us", href: "/#contact" },
  { label: "Points", href: "/#points" },
  { label: "FAQs", href: "/#faqs" },
  { label: "Shipping & Delivery", href: "/#shipping" },
  { label: "Terms & Conditions", href: "/#terms" },
  { label: "Refund & Return Policy", href: "/#refund-policy" },
  { label: "Trade License", href: "/#trade-license" },
  { label: "Privacy Policy", href: "/#privacy-policy" },
];

const socials = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/",
    icon: <Facebook className="h-5 w-5" />,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/",
    icon: <Instagram className="h-5 w-5" />,
  },
  {
    label: "WhatsApp",
    href: "https://www.whatsapp.com/",
    icon: <MessageCircle className="h-5 w-5" />,
  },
  {
    label: "X",
    href: "https://x.com/",
    icon: xIcon,
  },
];

const paymentMethods = ["bKash", "Nagad", "Mastercard", "Visa", "Amex"];

const FooterLinkColumn = ({ title, links, accentFirst = false }) => (
  <div>
    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-white">{title}</h3>
    <ul className="mt-5 space-y-3">
      {links.map((link, index) => (
        <li key={link.label}>
          <Link
            href={link.href}
            className={`group inline-flex items-center gap-2 text-sm transition hover:text-[#d5ffef] ${
              accentFirst && index === 1 ? "text-[#9cffd3]" : "text-white/90"
            }`}
          >
            <span className="h-px w-0 bg-[#91ffd0] transition-all duration-300 group-hover:w-5" />
            <span>{link.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

const BrandFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-20 overflow-hidden border-t border-[#2d8b6d] bg-[#0f3f33] text-white">
      <div className="pointer-events-none absolute -left-20 top-8 h-60 w-60 rounded-full bg-[#34d399]/15 blur-[120px]" />
      <div className="pointer-events-none absolute right-0 top-20 h-72 w-72 rounded-full bg-[#86efac]/10 blur-[130px]" />

      <div className="mx-auto max-w-7xl px-5 pb-8 pt-10 sm:px-8 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center">
              <Image
                src={khancoslogo}
                alt="KhanCosmetics"
                width={190}
                height={58}
                className="h-auto w-[150px] brightness-[2.1] contrast-[0.92] sm:w-[185px]"
              />
            </Link>
            <ul className="mt-5 space-y-2 text-sm text-white/95">
              <li>
                <Link href="/#our-story" className="hover:text-[#c9ffe6]">Our Story</Link>
              </li>
              <li>
                <Link href="/#beauty-journal" className="hover:text-[#c9ffe6]">KhanCosmetics Magazine</Link>
              </li>
              <li>
                <Link href="/#careers" className="hover:text-[#c9ffe6]">Join Our Team</Link>
              </li>
              <li>
                <Link href="/#authenticity" className="hover:text-[#c9ffe6]">Authenticity</Link>
              </li>
            </ul>

            <div className="my-4 h-px w-full max-w-[230px] bg-white/35" />

            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-white">Share Your Love</p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  className="group inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/45 bg-white/5 text-white shadow-[0_0_0_rgba(52,211,153,0)] transition-all duration-250 hover:-translate-y-0.5 hover:border-[#9affd5] hover:bg-[#125242] hover:text-[#d9ffef] hover:shadow-[0_0_16px_rgba(52,211,153,0.32)]"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <FooterLinkColumn title="Top Categories" links={shopLinks} />
          <FooterLinkColumn title="Quick Links" links={quickLinks} />
          <FooterLinkColumn title="All About Beauty" links={beautyLinks} accentFirst />
          <div>
            <FooterLinkColumn title="Help" links={helpLinks} />
            <div className="mt-6 border-t border-white/30 pt-4">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-white">Payments Accepted</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {paymentMethods.map((method) => (
                  <span
                    key={method}
                    className="inline-flex items-center rounded-md border border-white/45 bg-white/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white/95"
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/30 pt-5">
          <div className="flex flex-wrap justify-center gap-x-7 gap-y-2 text-sm text-white/95">
            <Link href="/#authenticity" className="hover:text-[#d1ffe8]">
              Authenticity
            </Link>
            <Link href="/#terms" className="hover:text-[#d1ffe8]">
              Terms & Conditions
            </Link>
            <Link href="/#privacy-policy" className="hover:text-[#d1ffe8]">
              Privacy Policy
            </Link>
            <Link href="/#refund-policy" className="hover:text-[#d1ffe8]">
              Refund & Return Policy
            </Link>
            <Link href="/#faqs" className="hover:text-[#d1ffe8]">
              FAQs
            </Link>
          </div>
          <p className="mt-4 text-center text-sm text-white/90">Copyright {year} KhanCosmetics. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default BrandFooter;
