import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import { UserProfile, AuthContextType, SignUpData } from "../types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("🕵️‍♂️ Checking for existing session...");

    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const currentUser = session?.user;
      const userMetadata = currentUser?.user_metadata;

      if (currentUser && userMetadata?.role) {
        const role = userMetadata.role;
        const userId = currentUser.id;
        const email = currentUser.email ?? "unknown@example.com";

        console.log("✅ User signed in:", {
          id: userId,
          email,
          role,
        });

        fetchUserProfile(userId, role, email);
      } else {
        setLoading(false);
      }
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("👂 Listening for auth state changes...");

        if (event === "SIGNED_IN" && session?.user) {
          const userId = session.user.id;
          const email = session.user.email ?? "unknown@example.com";
          const role = session.user.user_metadata?.role;

          console.log("⚡ Auth event:", event, email);
          console.log("✅ User signed in:", { id: userId, email, role });

          if (role) {
            fetchUserProfile(userId, role, email);
          } else {
            console.warn("❌ No role found in metadata");
            setLoading(false);
          }
        } else if (event === "SIGNED_OUT") {
          console.log("👋 User signed out");
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      console.log("🛑 Unsubscribing from auth state changes...");
      listener.subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (
    userId: string,
    role: "faculty" | "student" | "parent",
    email: string
  ) => {
    console.log("📡 Fetching profile for:", { userId, role });

    let table = "";
    switch (role) {
      case "faculty":
        table = "faculty";
        break;
      case "student":
        table = "students";
        break;
      case "parent":
        table = "parents";
        break;
    }

    try {
      console.log(`📚 Querying ${table} table...`);

      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("❌ Error fetching profile:", error);
      }

      const userData = data as UserProfile | null;

      if (!userData) {
        console.warn("⚠️ No profile data found, setting fallback user");
        setUser({
          id: "c59d6416-043a-4bf3-827c-488bb6992447",
          full_name: "Fallback User",
          email: email,
          role: role,
        });
        setLoading(false);
        return;
      }

      console.log("🙋 Profile data:", userData);
      setUser(userData);
    } catch (err) {
      console.error("💥 Unexpected error:", err);
    }

    setLoading(false);
  };

  const signup = async (data: SignUpData) => {
    const { email, password, full_name, role } = data;

    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, role },
      },
    });

    if (error) {
      throw error;
    }

    const userId = signUpData.user?.id;
    if (!userId) throw new Error("User ID not found after signup");

    const profileData = {
      id: userId,
      full_name,
      email,
    };

    let table = "";
    if (role === "faculty") table = "faculty";
    else if (role === "student") table = "students";
    else if (role === "parent") table = "parents";

    const { error: insertError } = await supabase
      .from(table)
      .insert([profileData]);

    if (insertError) throw insertError;
  };

  const login = async (
    email: string,
    password: string,
    role: "faculty" | "student" | "parent"
  ) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    const userId = data.user.id;
    fetchUserProfile(userId, role, email);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  useEffect(() => {
    console.log("👁 Final user state:", user);
    console.log("🔄 Loading state:", loading);
  }, [user, loading]);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
