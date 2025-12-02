'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/utils/axiosinterceptor';
import { API_ROUTES } from '@/config';
import { Input, Select, Button } from '@/components/ui/components';
import { Eye, EyeOff } from 'lucide-react';

export default function SignUpPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        phone: '',
        role: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        try {
            console.log('Submitting sign up request...', formData);
            const response = await apiClient.post(API_ROUTES.AUTH_SERVICE.REGISTER, formData);

            console.log('Sign up response:', response.data);

            if (response.status === 200 || response.status === 201) {
                setSuccessMessage('Account created successfully! Redirecting to login...');
                setTimeout(() => {
                    router.push('/login');
                }, 2000);
            } else {
                setError(response.data.message || 'Sign up failed. Please try again.');
            }
        } catch (error) {
            console.error('Error during sign up:', error);
            setError(error.response?.data?.message || 'An unexpected error occurred. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const roleOptions = [
        { value: 'student', label: 'Student' },
        { value: 'trainer', label: 'Trainer' },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                        Create your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                        Or{' '}
                        <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
                            sign in to your existing account
                        </Link>
                    </p>
                </div>

                {error && (
                    <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                                    <p>{error}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {successMessage && (
                    <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">Success</h3>
                                <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                                    <p>{successMessage}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <Input
                            label="Username"
                            id="username"
                            name="username"
                            type="text"
                            required
                            placeholder="Enter your username"
                            value={formData.username}
                            onChange={handleChange}
                            disabled={isLoading}
                            autoComplete="nickname"
                        />
                        <Input
                            label="Email address"
                            id="email"
                            name="email"
                            type="email"
                            required
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={isLoading}
                            autoComplete="username"
                        />
                        <Input
                            label="Password"
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={handleChange}
                            disabled={isLoading}
                            autoComplete="new-password"
                            suffix={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            }
                        />
                        <Input
                            label="Phone Number"
                            id="phone"
                            name="phone"
                            type="tel"
                            required
                            placeholder="Enter your phone number"
                            value={formData.phone}
                            onChange={handleChange}
                            disabled={isLoading}
                        />
                        <Select
                            label="I am a"
                            id="role"
                            name="role"
                            options={roleOptions}
                            value={formData.role}
                            onChange={handleChange}
                            disabled={isLoading}
                            required
                        />
                    </div>

                    <div>
                        <Button
                            type="submit"
                            fullWidth
                            loading={isLoading}
                            variant="primary"
                        >
                            {isLoading ? 'Creating account...' : 'Sign up'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
