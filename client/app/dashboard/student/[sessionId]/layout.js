import { SocketProvider } from "@/context/socketContext";
import { AuthProvider } from "@/context/AuthContext";

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
