
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/shared/Logo';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Loader2 } from 'lucide-react';
import type { UserProfile } from '@/lib/types';

const signUpSchema = z
  .object({
    firstName: z.string().min(1, { message: 'First name is required' }),
    lastName: z.string().min(1, { message: 'Last name is required' }),
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const signInSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.519-3.486-11.188-8.197l-6.57 4.82C9.656 39.663 16.318 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.447-2.274 4.481-4.244 5.994l6.19 5.238C42.021 35.856 44 30.134 44 24c0-1.341-.138-2.65-.389-3.917z" />
  </svg>
);

const AppleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24">
    <path fill="currentColor" d="M19.14,8.34a2.58,2.58,0,0,0-2.32-1.33,2.5,2.5,0,0,0-2.22,1.35,3.42,3.42,0,0,0-1.1-2.07A3.23,3.23,0,0,0,9.91,5.65a5.52,5.52,0,0,0-3.27,5.55c0,1.21.36,2.37.91,3.33a.11.11,0,0,0,0,.08,5.17,5.17,0,0,0,2.8,3.22,3.38,3.38,0,0,0,2.35.3,3.37,3.37,0,0,0,2.36-1,1.15,1.15,0,0,1,1.52.28,1.2,1.2,0,0,1,.27,1.54,5.33,5.33,0,0,1-3.66,1.86,5.2,5.2,0,0,1-3.79-.8,6.86,6.86,0,0,1-3.67-4.32,6.59,6.59,0,0,1,2.05-6.09,3.75,3.75,0,0,1,3.3-1.4A3.49,3.49,0,0,1,12.5,7.31a2.8,2.8,0,0,1,.84,1.89,4.28,4.28,0,0,0,1.17.05,2.46,2.46,0,0,1,2.13-1.28,2.78,2.78,0,0,1,2.49,1.37,4,4,0,0,0-1.89,3.21,4,4,0,0,0,1.9,3.18,1.18,1.18,0,0,1,.52,1.6,1.16,1.16,0,0,1-1.6-.54,4.64,4.64,0,0,1-1.57-2.65A4.6,4.6,0,0,1,19.14,8.34ZM12.18,2.58a1.2,1.2,0,0,1,1-1.3,1.22,1.22,0,0,1,1.29,1,2.64,2.64,0,0,0,.43,1.61,1.18,1.18,0,0,1-1,1.3A1.22,1.22,0,0,1,12.6,4.2,2.5,2.5,0,0,0,12.18,2.58Z" />
  </svg>
);

// Designated super admin email
const SUPER_ADMIN_EMAIL = 'victorehebhoria@gmail.com';


export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const signInForm = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (!isUserLoading && user) {
      handleSuccessfulLogin(user);
    }
  }, [user, isUserLoading, router, firestore]);

  const handleSuccessfulLogin = async (user: User) => {
    const isSuperAdmin = user.email?.toLowerCase() === SUPER_ADMIN_EMAIL;
    if (isSuperAdmin) {
      router.push('/admin');
      return;
    }

    const userDocRef = doc(firestore, 'userProfiles', user.uid);
    try {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists() && docSnap.data().isModerator) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error("Error checking for admin status, redirecting to dashboard:", error);
      router.push('/dashboard');
    }
  };


  const handleSignUp = async (values: z.infer<typeof signUpSchema>) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const user = userCredential.user;

      const isSuperAdmin = values.email.toLowerCase() === SUPER_ADMIN_EMAIL;

      const userProfile: UserProfile = {
        id: user.uid,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        isModerator: isSuperAdmin,
      };

      const userDocRef = doc(firestore, 'userProfiles', user.uid);
      await setDocumentNonBlocking(userDocRef, userProfile, { merge: true });

      toast({
        title: 'Account Created',
        description: "You've been successfully signed up!",
      });

      // Let the useEffect hook handle redirection
      // await handleSuccessfulLogin(user);

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (values: z.infer<typeof signInSchema>) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: 'Signed In',
        description: "You've successfully signed in.",
      });
      // Let the useEffect hook handle redirection
      // await handleSuccessfulLogin(userCredential.user);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description: error.message || 'Invalid credentials.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: GoogleAuthProvider | OAuthProvider) => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(firestore, 'userProfiles', user.uid);
      const docSnap = await getDoc(userDocRef);

      const isSuperAdmin = user.email?.toLowerCase() === SUPER_ADMIN_EMAIL;

      if (!docSnap.exists()) {
        const displayName = user.displayName || '';
        const [firstName, ...lastNameParts] = displayName.split(' ');
        const lastName = lastNameParts.join(' ');

        const userProfile: UserProfile = {
          id: user.uid,
          firstName: firstName,
          lastName: lastName,
          email: user.email || '',
          isModerator: isSuperAdmin,
        };
        await setDocumentNonBlocking(userDocRef, userProfile, { merge: true });
      } else if (isSuperAdmin && !docSnap.data().isModerator) {
        // If the user exists but isn't a moderator, and they are the super admin, update them.
        await setDocumentNonBlocking(userDocRef, { isModerator: true }, { merge: true });
      }

      toast({
        title: 'Signed In',
        description: `Welcome, ${user.displayName || 'User'}!`,
      });
      // Let the useEffect hook handle redirection
      // await handleSuccessfulLogin(user);

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description: error.message || 'An unexpected error occurred during social sign-in.',
      });
    } finally {
      setLoading(false);
    }
  }

  const onGoogleSignIn = () => handleSocialSignIn(new GoogleAuthProvider());
  const onAppleSignIn = () => handleSocialSignIn(new OAuthProvider('apple.com'));


  if (isUserLoading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-8 left-8">
        <Logo />
      </div>
      <Tabs defaultValue="sign-in" className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sign-in">Sign In</TabsTrigger>
          <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="sign-in">
          <Card>
            <CardHeader>
              <CardTitle>Welcome Back</CardTitle>
              <CardDescription>
                Sign in to your MindBud account to continue.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Form {...signInForm}>
                <form
                  onSubmit={signInForm.handleSubmit(handleSignIn)}
                  className="space-y-4"
                >
                  <FormField
                    control={signInForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="name@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signInForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </Form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <Button variant="outline" size="icon" onClick={onGoogleSignIn} disabled={loading} aria-label="Continue with Google">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleIcon className="h-5 w-5" />}
                </Button>
                <Button variant="outline" size="icon" onClick={onAppleSignIn} disabled={loading} aria-label="Continue with Apple">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <AppleIcon className="h-5 w-5" />}
                </Button>
              </div>

            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sign-up">
          <Card>
            <CardHeader>
              <CardTitle>Create an Account</CardTitle>
              <CardDescription>
                Get started with your personal wellness companion.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...signUpForm}>
                <form
                  onSubmit={signUpForm.handleSubmit(handleSignUp)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={signUpForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signUpForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={signUpForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="name@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signUpForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signUpForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


