import "./globals.css";
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: "Funnel Management",
  description: "Efficiently manage and streamline student assessments with our Funnel Management system. Conduct exams, evaluate performance, and filter top candidates for selection, training, or advancement.",
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
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}