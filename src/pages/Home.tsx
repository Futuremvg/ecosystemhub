import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Home page redirected to the new Clean God Mode Index
 * to maintain the elite, minimal interface requested.
 */
export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/");
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-t-2 border-primary rounded-full animate-spin" />
    </div>
  );
}
