"use client";

import Image from "next/image";
import { Facebook, Instagram, MessageCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { frontendurl } from "../utils/constants/serverurl";
import { useActiveLogo } from "../hooks/useActiveLogo";

const xIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
    <path d="M18.9 2H22l-6.77 7.74L23 22h-6.1l-4.78-6.25L6.65 22H3.52l7.24-8.28L1 2h6.26l4.32 5.71L18.9 2Zm-1.07 18.13h1.69L6.34 3.77H4.52l13.31 16.36Z" />
  </svg>
);

const shopLinks = [
  { label: "Makeup", href: `${frontendurl}/s/makeup` },
  { label: "Skin", href: `${frontendurl}/s/skin` },
  { label: "Eye Care", href: `${frontendurl}/s/makeup` },
  { label: "Hair", href: `${frontendurl}/s/hair` },
  { label: "Personal Care", href: `${frontendurl}/s/personalcare` },
  { label: "Undergarments", href: `${frontendurl}/s/undergarments` },
  { label: "Women Jewlerry", href: `${frontendurl}/s/jewellery` },
  { label: "Khan Cakes", href: `${frontendurl}/s/khancakes` },
  { label: "Men Product", href: `${frontendurl}/s/men` },
  { label: "Fragrance", href: `${frontendurl}/s/fragrance` },
  { label: "Mom & Baby", href: `${frontendurl}/s/mom-and-baby` },
];

const quickLinks = [
  { label: "BiggestOfferinKhanCakes", href: `${frontendurl}/s/khancakes` },
  { label: "Mens Products", href: `${frontendurl}/s/men` },
  { label: "Skin Concerns", href: "/#shop-by-category" },
  { label: "New Arrival", href: "/#new-arrivals" },
  { label: "Makeup", href: `${frontendurl}/s/makeup` },
];

const beautyLinks = [
  { label: "Know Your Routine", href: "/#beauty-journal" },
  { label: "Hair Care 101", href: "/#beauty-journal" },
  { label: "Skin Care 101", href: "/#beauty-journal" },
  { label: "Makeup 101", href: "/#beauty-journal" },
];

const helpLinks = [
  { label: "Contact Us", href: "/contact" },
  { label: "Points", href: "/points" },
  { label: "FAQs", href: "/faqs" },
  { label: "Shipping & Delivery", href: "/#hipping" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Refund & Return Policy", href: "/refund-policy" },
  { label: "Trade License", href: "/trade-license" },
  { label: "Privacy Policy", href: "/privacy-policy" },
];

const socials = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/share/1BU79YzKtv/?mibextid=wwXIfr",
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

const paymentMethods = [
  { label: "SSLCommerz", src: "/sslgcommez.png", width: 90,href:"https://sslcommerz.com/" },
  { label: "bKash", src: "/bikash.png", width: 62   ,href:"https://www.bkash.com/"},
  { label: "Nagad", src: "/nagad.png", width: 62 ,href:"https://nagad.com.bd/"},
  { label: "Mastercard", src: "/mastercard.png", width: 70   ,href:"https://www.mastercard.com/"},
  { label: "Visa", src: "/visacard.png", width: 62 ,href:"https://www.visa.com/"},
];

const FooterLinkColumn = ({ title, links, accentFirst = false }) => (
  <div>
    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-white">{title}</h3>
    <ul className="mt-5 space-y-3">
      {links.map((link, index) => (
        <li key={link.label}>
          {link.href.startsWith("http") ? (
            <a
              href={link.href}
              className={`group inline-flex items-center cursor-pointer gap-2 text-sm transition hover:text-[#d5ffef] ${
                accentFirst && index === 1 ? "text-[#9cffd3]" : "text-white/90"
              }`}
            >
              <span className="h-px w-0 bg-[#91ffd0] transition-all cursor-pointer duration-300 group-hover:w-5" />
              <span className="cursor-pointer">{link.label}</span>
            </a>
          ) : (
            <Link
              href={link.href}
              className={`group inline-flex items-center gap-2 text-sm transition hover:text-[#d5ffef] ${
                accentFirst && index === 1 ? "text-[#9cffd3]" : "text-white/90"
              }`}
            >
              <span className="h-px w-0 bg-[#91ffd0] transition-all duration-300 group-hover:w-5" />
              <span>{link.label}</span>
            </Link>
          )}
        </li>
      ))}
    </ul>
  </div>
);

const BrandFooter = () => {
  const year = new Date().getFullYear();
  const { logoUrl } = useActiveLogo();

  return (
    <footer className="relative mt-20 overflow-hidden border-t border-[#2d8b6d] bg-[#0f3f33] text-white">
      <div className="pointer-events-none absolute -left-20 top-8 h-60 w-60 rounded-full bg-[#34d399]/15 blur-[120px]" />
      <div className="pointer-events-none absolute right-0 top-20 h-72 w-72 rounded-full bg-[#86efac]/10 blur-[130px]" />

      <div className="mx-auto max-w-7xl px-5 pb-8 pt-10 sm:px-8 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center">
              <img
                src={logoUrl}
                alt="Glow Haat"
                className="h-auto w-[150px] brightness-[2.1] contrast-[0.92] sm:w-[185px]"
                loading="eager"
              />
            </Link>
            <ul className="mt-5 space-y-2 text-sm text-white/95">
              <li>
                <Link href="/ourstory" className="hover:text-[#c9ffe6]">Our Story</Link>
              </li>
              <li>
                <Link href="/beautyjournal" className="hover:text-[#c9ffe6]">Glow Haat Magazine</Link>
              </li>
              <li>
                <Link href="/khancosmeticscareers" className="hover:text-[#c9ffe6]">Join Our Team</Link>
              </li>
              <li>
                <Link href="/authenticity" className="hover:text-[#c9ffe6]">Authenticity</Link>
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
                  className="group inline-flex h-10 w-10 items-center cursor-pointer justify-center rounded-full border border-white/45 bg-white/5 text-white shadow-[0_0_0_rgba(52,211,153,0)] transition-all duration-250 hover:-translate-y-0.5 hover:border-[#9affd5] hover:bg-[#125242] hover:text-[#d9ffef] hover:shadow-[0_0_16px_rgba(52,211,153,0.32)]"
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
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-white">Payments Accepted By Glow Haat</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {paymentMethods.map((method) => (
                  <span
                    key={method.label}
                    className="inline-flex h-8 items-center rounded-md border cursor-pointer border-white/45 bg-white px-2 shadow-[0_4px_12px_-9px_rgba(0,0,0,0.45)]"
                  >
                    <Image
                      src={method.src}
                      alt={method.label}
                      width={method.width}
                      height={22}
                      className="h-auto max-h-5 w-auto object-contain cursor-pointer"
                    />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/30 pt-5">
          <div className="flex flex-wrap justify-center gap-x-7 gap-y-2 text-sm text-white/95">
            <Link href="/authenticity" className="hover:text-[#d1ffe8]">
              Authenticity
            </Link>
            <Link href="/terms" className="hover:text-[#d1ffe8]">
              Terms & Conditions
            </Link>
            <Link href="/privacy-policy" className="hover:text-[#d1ffe8]">
              Privacy Policy
            </Link>
            <Link href="/refund-policy" className="hover:text-[#d1ffe8]">
              Refund & Return Policy
            </Link>
            <Link href="/faqs" className="hover:text-[#d1ffe8]">
              FAQs
            </Link>
          </div>
          <p className="mt-4 text-center text-sm text-white/90">Copyright {year} Glow Haat. All rights reserved By Glow Haat.</p>
        </div>
      </div>
    </footer>
  );
};

export default BrandFooter;




