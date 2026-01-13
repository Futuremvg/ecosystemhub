import { useState, useEffect, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta ao Architecta.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const signUpWithEmail = useCallback(async (email: string, password: string, fullName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });
      if (error) throw error;
      toast({
        title: "Conta criada!",
        description: "Sua conta foi criada com sucesso.",
      });
    } catch (error: any) {
      if (error.message.includes("already registered")) {
        toast({
          title: "Email já cadastrado",
          description: "Este email já está em uso. Tente fazer login.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao criar conta",
          description: error.message,
          variant: "destructive",
        });
      }
      throw error;
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    try {
      // Clear local state first to ensure UI updates
      setUser(null);
      setSession(null);
      
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
      
      toast({
        title: "Logout realizado",
        description: "Você saiu da sua conta.",
      });
      
      // Force navigation to auth page - fixes Safari issue
      // Using setTimeout to ensure state is cleared before navigation
      setTimeout(() => {
        window.location.href = '/auth';
      }, 100);
    } catch (error: any) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
      // Even on error, try to navigate to auth
      setTimeout(() => {
        window.location.href = '/auth';
      }, 100);
    }
  }, [toast]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });
      if (error) throw error;
      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erro ao enviar email",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error };
    }
  }, [toast]);

  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      toast({
        title: "Senha atualizada!",
        description: "Sua nova senha foi definida com sucesso.",
      });
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar senha",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error };
    }
  }, [toast]);

  return {
    user,
    session,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    resetPassword,
    updatePassword,
  };
}