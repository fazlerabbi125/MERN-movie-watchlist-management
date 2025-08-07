import { Suspense } from 'react';
import { LoginForm } from '@/components/LoginForm';
import { OAuthButtons } from '@/components/OAuthButtons';
import { RegisterForm } from '@/components/RegisterForm';
import Link from 'next/link';

interface LoginPageProps {
    searchParams: { [key: string]: string | string[] | undefined };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
    const mode = searchParams.mode as string;
    const error = searchParams.error as string;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {mode === 'register' ? 'Create your account' : 'Sign in to your account'}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {mode === 'register' ? (
                            <>
                                Already have an account?{' '}
                                <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                                    Sign in
                                </Link>
                            </>
                        ) : (
                            <>
                                Don&apos;t have an account?{' '}
                                <Link href="/login?mode=register" className="font-medium text-indigo-600 hover:text-indigo-500">
                                    Sign up
                                </Link>
                            </>
                        )}
                    </p>
                </div>

                <div className="mt-8 space-y-6">
                    {error && (
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="text-sm text-red-700">
                                {error === 'oauth_failed' && 'OAuth authentication failed. Please try again.'}
                                {error === 'oauth_error' && 'An error occurred during authentication.'}
                                {error !== 'oauth_failed' && error !== 'oauth_error' && error}
                            </div>
                        </div>
                    )}

                    <Suspense fallback={<div>Loading...</div>}>
                        <OAuthButtons />
                    </Suspense>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    {mode === 'register' ? (
                        <RegisterForm />
                    ) : (
                        <LoginForm />
                    )}
                </div>
            </div>
        </div>
    );
}
