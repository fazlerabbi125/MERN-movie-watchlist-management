'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/lib/auth';

export default function OAuthCallbackPage() {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                const callbackUrl = window.location.href;
                await AuthService.handleOAuthCallback(callbackUrl);
                
                setStatus('success');
                
                // Redirect to dashboard after successful authentication
                setTimeout(() => {
                    router.push('/dashboard');
                }, 2000);
            } catch (error: any) {
                setStatus('error');
                setError(error.message);
                
                // Redirect to login page after error
                setTimeout(() => {
                    router.push('/login?error=oauth_failed');
                }, 3000);
            }
        };

        handleCallback();
    }, [router]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Processing authentication...</p>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-green-600 text-4xl mb-4">✓</div>
                    <h1 className="text-xl font-semibold text-gray-900">Authentication Successful</h1>
                    <p className="mt-2 text-gray-600">Redirecting to dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="text-red-600 text-4xl mb-4">✗</div>
                <h1 className="text-xl font-semibold text-gray-900">Authentication Failed</h1>
                <p className="mt-2 text-gray-600">{error}</p>
                <p className="mt-4 text-sm text-gray-500">Redirecting to login page...</p>
            </div>
        </div>
    );
}
