import { useEffect, ReactNode, createContext, useContext, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import useStore from "@/lib/store";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const initialize = useStore((state) => state.initialize);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check authentication and initialize store
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // If not authenticated and not on login page, redirect
        if (!session && router.pathname !== "/login") {
          router.push("/login");
          return;
        }

        // If authenticated, initialize store
        if (session) {
          setUser(session.user);
          await initialize();
        }
      } catch (error: any) {
         
        console.log("[AuthProvider][checkAuth] thrown error", {
          message: error?.message,
          stack: error?.stack,
          error,
        });
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (session) {
            setUser(session.user);
          } else {
            setUser(null);
          }

          if (event === "SIGNED_IN" && session) {
            await initialize();
          } else if (event === "SIGNED_OUT") {
            router.push("/login");
          }
        } catch (error: any) {
           
          console.log("[AuthProvider][onAuthStateChange] thrown error", {
            message: error?.message,
            stack: error?.stack,
            error,
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router, initialize]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
