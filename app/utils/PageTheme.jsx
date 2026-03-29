"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

const themectx = createContext();

export const ThemeWrapper = ({ children, defaultTheme = "light" }) => {
  const [theme, settheme] = useState(defaultTheme);

  useEffect(() => {
    const saved = localStorage.getItem("page-theme");
    if (saved) settheme(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("page-theme", theme);
  }, [theme]);

  return (
    <themectx.Provider value={{ theme, settheme }}>
      <div
        className={`min-h-screen transition-all duration-300 ${
          theme === "dark"
            ? "bg-black text-white"
            : "bg-white text-black"
        }`}
      >
        {children}
      </div>
    </themectx.Provider>
  );
};

export const usePageTheme = () => useContext(themectx);
