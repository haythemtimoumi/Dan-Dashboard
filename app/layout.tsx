import { Metadata } from "next";

import "@/app/ui/global.css"
import {inter} from "@/app/ui/fonts"
import QueryProvider from "@/app/providers/query-provider";
import { Toaster } from 'react-hot-toast';
import { SettingsProvider } from "@/app/contexts/settings-context";
import { AuthProvider } from "@/app/contexts/auth-context";


export const metadata:Metadata={
title:{
  template:"%s | Stock Screener",
  default:"Stock Screener"
},
description:"Stock Screener",
metadataBase:new URL("https://www.mytickerlist.com/"),
icons: {
  icon: {
    url: '/favicon.ico',
    sizes: '32x32',
  },
}
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <SettingsProvider>
            <QueryProvider>
              {children}
              <Toaster position="top-right" />
            </QueryProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
