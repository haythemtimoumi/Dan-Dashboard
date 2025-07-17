import { Metadata } from "next";

import "@/app/ui/global.css"
import {inter} from "@/app/ui/fonts"
import QueryProvider from "@/app/providers/query-provider";
import { Toaster } from 'react-hot-toast';
import { SettingsProvider } from "@/app/contexts/settings-context";
import { AuthProvider } from "@/app/contexts/auth-context";


export const metadata:Metadata={
title:{
  template:"%s | Dan's Dashboard",
  default:"Dan's Dashboard"
},
description:"Dan's Dashboard",
metadataBase:new URL("https://dashboard-v1-ashy.vercel.app/")
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
