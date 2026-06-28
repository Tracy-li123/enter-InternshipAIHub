import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, SUPABASE_URL } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';

type View = 'auth' | 'verify-email' | 'forgot-password' | 'forgot-sent' | 'reset-password' | 'verifying';

// Build the emailRedirectTo URL: points to our auth-redirect Edge Function,
// which then forwards the PKCE code to the actual app URL.
// The Edge Function lives on the Supabase domain so it bypasses the redirect URL allowlist.
const buildRedirectUrl = () => {
  const appUrl = encodeURIComponent(window.location.origin);
  return `${SUPABASE_URL}/functions/v1/auth-redirect?app_url=${appUrl}`;
};

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  // Read URL hash BEFORE Supabase's async _initialize() clears/processes it.
  // Supabase processes the hash asynchronously (network token exchange), so
  // the hash is still available during the first synchronous render.
  const initialHashType = useMemo(() => {
    try {
      return new URLSearchParams(window.location.hash.substring(1)).get('type');
    } catch { return null; }
  }, []); // empty deps → runs once on mount, before any effects

  // Detect PKCE code in URL (?code=xxx) — means user arrived via email link
  const hasPkceCode = useMemo(() => {
    try {
      return !!new URLSearchParams(window.location.search).get('code');
    } catch { return false; }
  }, []);

  const [view, setView] = useState<View>(() => {
    if (hasPkceCode) return 'verifying'; // PKCE code exchange in progress
    if (initialHashType === 'recovery') return 'reset-password';
    return 'auth';
  });
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const recoveryMode = useRef(initialHashType === 'recovery');

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ email: '', password: '', name: '' });
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Redirect if already logged in (but not during password reset)
  useEffect(() => {
    if (!loading && user && !recoveryMode.current) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  // Listen for PASSWORD_RECOVERY or SIGNED_IN after PKCE code exchange
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User clicked a password-reset link → show reset form
        recoveryMode.current = true;
        setView('reset-password');
      }
      // SIGNED_IN during 'verifying' = email verification success
      // The user useEffect below handles navigation to '/'
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Login ────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
      });
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          toast.error('邮箱尚未验证，请先查收验证邮件并点击链接');
        } else if (error.message.includes('Invalid login credentials')) {
          toast.error('邮箱或密码错误');
        } else {
          toast.error(error.message || '登录失败');
        }
        return;
      }
      // Navigation handled by useEffect
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '登录失败');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Signup ───────────────────────────────────────────────────────────────
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: signupForm.email,
        password: signupForm.password,
        options: {
          emailRedirectTo: buildRedirectUrl(),
          data: { display_name: signupForm.name },
        },
      });
      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('该邮箱已注册，请直接登录');
        } else {
          toast.error(error.message || '注册失败，请重试');
        }
        return;
      }
      // Email verification required — show verify prompt
      setVerifiedEmail(signupForm.email);
      setView('verify-email');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '注册失败');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Forgot password ──────────────────────────────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: buildRedirectUrl(),
      });
      if (error) throw error;
      setView('forgot-sent');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '发送失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Reset password ───────────────────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('两次密码输入不一致');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('密码至少需要6位');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('密码已更新，正在跳转...');
      setTimeout(() => navigate('/', { replace: true }), 1500);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '密码更新失败');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Resend verification email ────────────────────────────────────────────
  const handleResendVerification = async () => {
    if (!verifiedEmail) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: verifiedEmail,
        options: { emailRedirectTo: buildRedirectUrl() },
      });
      if (error) throw error;
      toast.success('验证邮件已重新发送');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '发送失败');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'var(--gradient-primary)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'var(--gradient-secondary)' }} />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--gradient-primary)' }}>
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">职达实习生</h1>
        </div>

        {/* ── Verifying (PKCE code exchange in progress) ── */}
        {view === 'verifying' && (
          <Card className="border shadow-lg text-center">
            <CardContent className="pt-8 pb-8 space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">正在验证身份</h2>
                <p className="text-sm text-muted-foreground">请稍候...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Verify Email Prompt ── */}
        {view === 'verify-email' && (
          <Card className="border shadow-lg text-center">
            <CardContent className="pt-8 pb-8 space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">请验证你的邮箱</h2>
                <p className="text-sm text-muted-foreground">
                  验证邮件已发送至<br />
                  <span className="font-medium text-foreground">{verifiedEmail}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-3">
                  点击邮件中的链接完成验证后即可登录
                </p>
              </div>
              <div className="space-y-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResendVerification}
                  disabled={submitting}
                  className="w-full"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  重新发送验证邮件
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setView('auth')}
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  返回登录
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Forgot Password Form ── */}
        {view === 'forgot-password' && (
          <Card className="border shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">忘记密码</CardTitle>
              <CardDescription>输入注册邮箱，我们将发送密码重置链接</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">注册邮箱</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="your@email.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  发送重置邮件
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setView('auth')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  返回登录
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ── Forgot Sent Confirmation ── */}
        {view === 'forgot-sent' && (
          <Card className="border shadow-lg text-center">
            <CardContent className="pt-8 pb-8 space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">重置邮件已发送</h2>
                <p className="text-sm text-muted-foreground">
                  请查收 <span className="font-medium text-foreground">{forgotEmail}</span> 的邮件<br />
                  点击邮件中的链接来重置密码
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView('auth')}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回登录
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── Reset Password Form ── */}
        {view === 'reset-password' && (
          <Card className="border shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">设置新密码</CardTitle>
              <CardDescription>请输入你的新密码</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">新密码</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="至少6位密码"
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">确认新密码</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="再次输入新密码"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  保存新密码
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ── Login / Signup Tabs ── */}
        {view === 'auth' && (
          <Card className="border shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-center text-xl">欢迎回来</CardTitle>
              <CardDescription className="text-center">管理你的求职进度，追踪每一个机会</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">登录</TabsTrigger>
                  <TabsTrigger value="signup">注册</TabsTrigger>
                </TabsList>

                {/* Login */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">邮箱</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your@email.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm(f => ({ ...f, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">密码</Label>
                        <button
                          type="button"
                          onClick={() => setView('forgot-password')}
                          className="text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                          忘记密码？
                        </button>
                      </div>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="输入密码"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm(f => ({ ...f, password: e.target.value }))}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      登录
                    </Button>
                  </form>
                </TabsContent>

                {/* Signup */}
                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">昵称</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="你的名字"
                        value={signupForm.name}
                        onChange={(e) => setSignupForm(f => ({ ...f, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">邮箱</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        value={signupForm.email}
                        onChange={(e) => setSignupForm(f => ({ ...f, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">密码</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="至少6位密码"
                        minLength={6}
                        value={signupForm.password}
                        onChange={(e) => setSignupForm(f => ({ ...f, password: e.target.value }))}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      注册
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      注册后需要验证邮箱才能登录
                    </p>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
