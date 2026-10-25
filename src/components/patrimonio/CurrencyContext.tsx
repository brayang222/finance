"use client";
import { createContext, useContext } from "react";

export const CurrencyContext = createContext<"COP" | "USD">("COP");
export const useCurrency = () => useContext(CurrencyContext);
