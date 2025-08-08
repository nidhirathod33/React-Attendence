import React from "react";
import { Toaster } from "react-hot-toast";
import { AnimatedBackground } from "./components/ui/AnimatedBackground";
import { AuthForm } from "./components/auth/AuthForm";
import { FacultyDashboard } from "./components/faculty/FacultyDashboard";
import { StudentDashboard } from "./components/student/StudentDashboard";
import { ParentDashboard } from "./components/parent/ParentDashboard";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoadingSpinner } from "./components/ui/LoadingSpinner";

function AppContent() {
  const { user, loading } = useAuth();

  console.log("AppContent render:", { user, loading });

  if (loading) {
    console.log("Loading user data, showing spinner...");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    console.log("No user logged in, showing AuthForm...");
    return (
      <>
        <AnimatedBackground />
        <AuthForm />
      </>
    );
  }

  console.log("User is logged in with role:", user.role);

  switch (user.role) {
    case "faculty":
      return <FacultyDashboard />;
    case "student":
      return <StudentDashboard />;
    case "parent":
      return <ParentDashboard />;
    default:
      console.warn("Unknown user role:", user.role);
      return (
        <>
          <AnimatedBackground />
          <AuthForm />
        </>
      );
  }
}

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <AppContent />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "12px",
            },
          }}
        />
      </div>
    </AuthProvider>
  );
}

export default App;
