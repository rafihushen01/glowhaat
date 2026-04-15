"use client";

import React, { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import KhanChatHub from "./KhanChatHub";

const SellerChatDrawer = ({ shop = null, product = null, buttonClassName = "" }) => {
  const [open, setOpen] = useState(false);

  const canStart = Boolean(shop?.slug || shop?._id);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!canStart}
        className={
          buttonClassName ||
          "inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
        }
      >
        <MessageCircle className="h-4 w-4" />
        Chat With Seller
      </button>

      {open ? (
        <div className="fixed inset-0 z-[120]">
          <button type="button" className="absolute inset-0 bg-black/45" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 top-0 m-auto h-[95vh] w-[96vw] max-w-6xl rounded-2xl border border-emerald-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-emerald-100 px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">KhanChat</p>
                <p className="text-sm font-semibold text-emerald-950">{shop?.shopname || "Seller Chat"}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-emerald-300 p-2 text-emerald-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="h-[calc(95vh-65px)] overflow-hidden">
              <KhanChatHub initialShop={shop} initialProduct={product} embedded />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default SellerChatDrawer;
