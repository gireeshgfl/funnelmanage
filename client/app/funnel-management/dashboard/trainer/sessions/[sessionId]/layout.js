import { SocketProvider } from "@/context/socketContext";
import { AuthProvider } from "@/context/AuthContext";
import Header from "@/components/layout/Header";

export default function Layout({ children }) {
  return (
    <>
      <AuthProvider>
      <SocketProvider>
            {children}
        </SocketProvider>
      </AuthProvider>
    </>
  );
}
