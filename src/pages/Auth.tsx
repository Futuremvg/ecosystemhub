import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, User, Loader2, Check, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/ui/Logo";
import { z } from "zod";
import { cn } from "@/lib/utils";

const emailSchema = z.string().email("Email inválido");

// Strong password validation
const passwordRequirements = {
  minLength: { test: (p: string) => p.length >= 8, label: "Mínimo 8 caracteres" },
  hasNumber: { test: (p: string) => /\d/.test(p), label: "Pelo menos 1 número" },
  hasSymbol: { test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p), label: "Pelo menos 1 símbolo (!@#$%...)" },
  hasUppercase: { test: (p: string) => /[A-Z]/.test(p), label: "Pelo menos 1 letra maiúscula" },
};

const strongPasswordSchema = z.string()
  .min(8, "Senha deve ter pelo menos 8 caracteres")
  .regex(/\d/, "Senha deve conter pelo menos 1 número")
  .regex(/[!@#$%^&*(),.?":{}|<>]/, "Senha deve conter pelo menos 1 símbolo")
  .regex(/[A-Z]/, "Senha deve conter pelo menos 1 letra maiúscula");

const loginPasswordSchema = z.string().min(6, "Senha deve ter pelo menos 6 caracteres");

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading, signInWithEmail, signUpWithEmail, resetPassword, updatePassword } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Password reset states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Check if user is resetting password (came from email link)
  const isResetMode = searchParams.get("mode") === "reset";

  useEffect(() => {
    // Don't redirect if in reset mode (user needs to set new password)
    if (user && !loading && !isResetMode) {
      navigate("/");
    }
  }, [user, loading, navigate, isResetMode]);

  const validateEmail = (email: string): boolean => {
    try {
      emailSchema.parse(email);
      return true;
    } catch {
      return false;
    }
  };

  const validateLoginPassword = (password: string): boolean => {
    try {
      loginPasswordSchema.parse(password);
      return true;
    } catch {
      return false;
    }
  };

  const validateStrongPassword = (password: string): boolean => {
    try {
      strongPasswordSchema.parse(password);
      return true;
    } catch {
      return false;
    }
  };

  // Password strength indicator for signup
  const passwordStrength = useMemo(() => {
    const results = Object.entries(passwordRequirements).map(([key, req]) => ({
      key,
      label: req.label,
      passed: req.test(signupPassword),
    }));
    const passedCount = results.filter(r => r.passed).length;
    return { results, passedCount, total: results.length };
  }, [signupPassword]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (!validateEmail(loginEmail)) {
      setErrors({ loginEmail: "Email inválido" });
      return;
    }
    if (!validateLoginPassword(loginPassword)) {
      setErrors({ loginPassword: "Senha deve ter pelo menos 6 caracteres" });
      return;
    }

    setIsSubmitting(true);
    try {
      await signInWithEmail(loginEmail, loginPassword);
    } catch {
      // Error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (!validateEmail(signupEmail)) {
      setErrors({ signupEmail: "Email inválido" });
      return;
    }
    if (!validateStrongPassword(signupPassword)) {
      setErrors({ signupPassword: "Senha não atende aos requisitos de segurança" });
      return;
    }

    setIsSubmitting(true);
    try {
      await signUpWithEmail(signupEmail, signupPassword, signupName);
    } catch {
      // Error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (!validateEmail(resetEmail)) {
      setErrors({ resetEmail: "Email inválido" });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await resetPassword(resetEmail);
      if (result.success) {
        setResetEmailSent(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (!validateStrongPassword(newPassword)) {
      setErrors({ newPassword: "Senha não atende aos requisitos de segurança" });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: "As senhas não coincidem" });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updatePassword(newPassword);
      if (result.success) {
        navigate("/");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password strength for new password in reset mode
  const newPasswordStrength = useMemo(() => {
    const results = Object.entries(passwordRequirements).map(([key, req]) => ({
      key,
      label: req.label,
      passed: req.test(newPassword),
    }));
    const passedCount = results.filter(r => r.passed).length;
    return { results, passedCount, total: results.length };
  }, [newPassword]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-god-gold" />
      </div>
    );
  }

  // Reset password mode (user clicked link from email)
  if (isResetMode && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md relative z-10 border-border/50 bg-card/80 backdrop-blur">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <Logo size="lg" showText={false} />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">Nova Senha</CardTitle>
            <CardDescription className="text-muted-foreground">
              Defina sua nova senha
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.newPassword && (
                  <p className="text-xs text-destructive">{errors.newPassword}</p>
                )}
                
                {/* Password strength indicator */}
                {newPassword.length > 0 && (
                  <div className="space-y-2 mt-2 p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all duration-300",
                            newPasswordStrength.passedCount === 0 && "w-0",
                            newPasswordStrength.passedCount === 1 && "w-1/4 bg-destructive",
                            newPasswordStrength.passedCount === 2 && "w-2/4 bg-orange-500",
                            newPasswordStrength.passedCount === 3 && "w-3/4 bg-yellow-500",
                            newPasswordStrength.passedCount === 4 && "w-full bg-financial-positive"
                          )}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {newPasswordStrength.passedCount}/{newPasswordStrength.total}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {newPasswordStrength.results.map((req) => (
                        <div 
                          key={req.key}
                          className={cn(
                            "flex items-center gap-1.5 text-xs",
                            req.passed ? "text-financial-positive" : "text-muted-foreground"
                          )}
                        >
                          {req.passed ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <X className="w-3 h-3" />
                          )}
                          <span>{req.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                )}
              </div>
              
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Salvar Nova Senha"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Forgot password screen
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md relative z-10 border-border/50 bg-card/80 backdrop-blur">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <Logo size="lg" showText={false} />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              {resetEmailSent ? "Email Enviado!" : "Recuperar Senha"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {resetEmailSent 
                ? "Verifique sua caixa de entrada" 
                : "Digite seu email para receber o link de recuperação"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {resetEmailSent ? (
              <div className="space-y-4 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-financial-positive/20 flex items-center justify-center">
                  <Check className="w-8 h-8 text-financial-positive" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Enviamos um link de recuperação para <strong>{resetEmail}</strong>. 
                  Clique no link para definir uma nova senha.
                </p>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmailSent(false);
                    setResetEmail("");
                  }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar ao Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.resetEmail && (
                    <p className="text-xs text-destructive">{errors.resetEmail}</p>
                  )}
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Enviar Link de Recuperação"
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full gap-2"
                  onClick={() => setShowForgotPassword(false)}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar ao Login
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float-particle ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <Card className="w-full max-w-md relative z-10 border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="text-center pb-2">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <Logo size="lg" showText={false} />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Architecta</CardTitle>
          <CardDescription className="text-muted-foreground">
            Seu sistema operacional empresarial com God Mode
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* Email/Password Tabs */}
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar Conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 mt-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.loginEmail && (
                    <p className="text-xs text-destructive">{errors.loginEmail}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.loginPassword && (
                    <p className="text-xs text-destructive">{errors.loginPassword}</p>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-primary hover:underline text-left"
                >
                  Esqueci minha senha
                </button>
                
                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-4">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Seu nome"
                      className="pl-10"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.signupEmail && (
                    <p className="text-xs text-destructive">{errors.signupEmail}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.signupPassword && (
                    <p className="text-xs text-destructive">{errors.signupPassword}</p>
                  )}
                  
                  {/* Password strength indicator */}
                  {signupPassword.length > 0 && (
                    <div className="space-y-2 mt-2 p-3 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all duration-300",
                              passwordStrength.passedCount === 0 && "w-0",
                              passwordStrength.passedCount === 1 && "w-1/4 bg-destructive",
                              passwordStrength.passedCount === 2 && "w-2/4 bg-orange-500",
                              passwordStrength.passedCount === 3 && "w-3/4 bg-yellow-500",
                              passwordStrength.passedCount === 4 && "w-full bg-financial-positive"
                            )}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {passwordStrength.passedCount}/{passwordStrength.total}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {passwordStrength.results.map((req) => (
                          <div 
                            key={req.key}
                            className={cn(
                              "flex items-center gap-1.5 text-xs",
                              req.passed ? "text-financial-positive" : "text-muted-foreground"
                            )}
                          >
                            {req.passed ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <X className="w-3 h-3" />
                            )}
                            <span>{req.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Criar Conta"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}