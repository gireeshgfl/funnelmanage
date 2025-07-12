import "./globals.css";

export const metadata = {
  title: "Funnel Management",
  description: "Efficiently manage and streamline student assessments with our Funnel Management system. Conduct exams, evaluate performance, and filter top candidates for selection, training, or advancement.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap"
          as="style"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap"
        />
      </head>
      <body className="font-sans">
        {children}
      </body>
    </html>
  );
}