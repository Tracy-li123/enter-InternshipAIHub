import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ email: '', password: '', name: '' });

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) navigate('/', { replace: true });
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
      });
      if (error) throw error;
      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      toast.error(msg === 'Invalid login credentials' ? '邮箱或密码错误' : (msg || '登录失败'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: signupForm.email,
        password: signupForm.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { display_name: signupForm.name },
        },
      });
      if (error) throw error;
      toast.success('注册成功！正在登录...');
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: signupForm.email,
        password: signupForm.password,
      });
      if (!loginError) navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg?.includes('already registered')) {
        toast.error('该邮箱已注册，请直接登录');
      } else {
        toast.error(msg || '注册失败，请重试');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      {/* Background gradient decoration */}
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
                    <Label htmlFor="login-password">密码</Label>
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
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
