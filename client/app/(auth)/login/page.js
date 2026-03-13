'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/utils/axiosinterceptor';
import { API_ROUTES } from '@/config';
import { useEmailOperations } from '@/hooks/useEmailOperations';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [participantEmail, setParticipantEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const router = useRouter();

  // Use the email operations hook
  const { sendEmail, loading: emailLoading, feedbackMessage } = useEmailOperations();

  const handleRoleBasedRedirect = (role) => {
    console.log('Redirecting with role:', role);

    const validRoles = ['trainer', 'student', 'super-admin', 'sub-admin'];

    if (role && validRoles.includes(role.toLowerCase())) {
      router.replace(`/dashboard/${role.toLowerCase()}`);
    } else {
      router.replace('/unauthorized');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setActiveTab('login');

    try {
      console.log('Submitting login request...');
      const response = await apiClient.post(API_ROUTES.AUTH_SERVICE.SIGNIN, {
        email,
        password,
      });

      console.log('Login response:', response.data);

      if (response.status === 200 && response.data.status === 200) {
        console.log('Login successful, role:', response.data.role);
        setTimeout(() => {
          handleRoleBasedRedirect(response.data.role);
        }, 100);
      } else {
        setError(response.data.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Error during login:', error);
      setError(error.response?.data?.message || 'An unexpected error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleParticipantAccessSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setActiveTab('participantAccess');

    try {
      console.log('Requesting participant access...');

      // Use the hook to send the email
      const response = await sendEmail(participantEmail);

      console.log('Participant access response:', response);

      if (response) {
        // Store the participant email and temporary session data
        localStorage.setItem('participantEmail', participantEmail);
        localStorage.setItem('tempSession', JSON.stringify(response.session));

        // Redirect to session page
        if (response.redirectUrl) {
          router.replace(response.redirectUrl);
        } else {
          router.replace('/dashboard/student/participants_sessions/');
        }
      }
    } catch (error) {
      console.error('Error during participant access:', error);
      setError(error.response?.data?.message || 'Unable to find sessions for this email. Please contact your trainer.');
    }
  };

  // Display error for participant access if there's an error or non-success feedback message
  const displayParticipantError = error || (activeTab === 'participantAccess' && feedbackMessage && !feedbackMessage.includes('success'));

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full flex bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        {/* Left Partition - Login Form */}
        <div className="w-1/2 p-8 border-r border-gray-200 dark:border-gray-700">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Sign in to your account
            </h2>
          </div>

          {error && activeTab === 'login' && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 mb-4">
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

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter your password"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  Remember me
                </label>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading && activeTab === 'login'}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${isLoading && activeTab === 'login' ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {isLoading && activeTab === 'login' ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : 'Sign in'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Partition - Participant Access */}
        <div className="w-1/2 p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Joining as a participant?
            </h2>
            <p className="text-sm text-gray-60 dark:text-gray-400 mt-2">
              Enter your email to access your sessions
            </p>
          </div>

          {displayParticipantError && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 mb-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    <p>{displayParticipantError}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {feedbackMessage && activeTab === 'participantAccess' && feedbackMessage.includes('success') && (
            <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4 mb-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-200">Success</h3>
                  <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                    <p>{feedbackMessage}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleParticipantAccessSubmit}>
            <div>
              <label htmlFor="participant-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <input
                id="participant-email"
                name="participant-email"
                type="email"
                autoComplete="email"
                required
                value={participantEmail}
                onChange={(e) => setParticipantEmail(e.target.value)}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter your email address"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={emailLoading && activeTab === 'participantAccess'}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${emailLoading && activeTab === 'participantAccess' ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {emailLoading && activeTab === 'participantAccess' ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Checking access...
                  </>
                ) : 'Access My Sessions'}
              </button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Participant Access:</h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 list-disc pl-5">
              <li>Enter the email address used by your trainer</li>
              <li>Access your scheduled sessions without registration</li>
              <li>No password required - quick and easy access</li>
            </ul>
          </div>

          <div className="mt-6 text-center text-sm">
            <a href="#" className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500">
              Managed By Eduvocate
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}