import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import loginBackground from '@/assets/login-background.jpg';
import abelovLogo from '@/assets/abelov-logo.png';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [userType, setUserType] = useState<'user' | 'admin'>('user');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: 'Error',
            description: 'Passwords do not match',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        // Validate password strength
        if (formData.password.length < 6) {
          toast({
            title: 'Error',
            description: 'Password must be at least 6 characters',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        // Sign up the user (assign selected role)
        await signUp(formData.email, formData.password, userType);
        toast({
          title: 'Success',
          description: `Account created as ${userType}. You can now log in.`,
        });
        setIsSignUp(false);
        setUserType('user');
        setFormData({ email: '', password: '', confirmPassword: '' });
      } else {
        // Validate fields
        if (!formData.email || !formData.password) {
          toast({
            title: 'Error',
            description: 'Please enter email and password',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        await signIn(formData.email, formData.password);
        toast({
          title: 'Success',
          description: 'Logged in successfully',
        });
        navigate('/dashboard');
      }
    } catch (error: Error | unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Authentication failed';
      console.error('Auth error:', error);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${loginBackground})` }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      <Card className="w-full max-w-md p-8 shadow-2xl relative z-10 bg-white/95 backdrop-blur">
        <div className="mb-8 text-center">
          <img src={abelovLogo} alt="Abelov Logo" className="w-20 rounded-3xl h-20 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-primary mb-2">Abelov Technical Records</h1>
          <p className="text-muted-foreground">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          {isSignUp && (
            <>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <Label className="text-base font-semibold mb-3 block">Account Type</Label>
                <RadioGroup value={userType} onValueChange={(val) => setUserType(val as 'user' | 'admin')}>
                  <div className="flex items-center space-x-2 mb-3">
                    <RadioGroupItem value="user" id="user-type" />
                    <Label htmlFor="user-type" className="font-normal cursor-pointer">
                      <span className="font-semibold">Regular User (Technician)</span>
                      <p className="text-xs text-muted-foreground mt-1">Manage your own service requests and tickets</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="admin" id="admin-type" />
                    <Label htmlFor="admin-type" className="font-normal cursor-pointer">
                      <span className="font-semibold">Admin</span>
                      <p className="text-xs text-muted-foreground mt-1">Monitor all users and tickets in the system</p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isSignUp ? 'Creating account...' : 'Logging in...'}
              </>
            ) : (
              isSignUp ? 'Create Account' : 'Login'
            )}
          </Button>
        </form>

        {/* <div className="mt-6">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setUserType('user');
              setFormData({ email: '', password: '', confirmPassword: '' });
            }}
            className="w-full text-sm text-primary hover:underline"
          >
            {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign up"}
          </button>
        </div> */}
      </Card>
    </div>
  );
}
