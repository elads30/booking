import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BookYourDoc - Premium Appointment Booking App",
  description: "Schedule your appointments instantly with real-time slots availability.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 'light';
                document.documentElement.setAttribute('data-theme', theme);
              })()
            `,
          }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
