'use client';
import React, { useState } from 'react';
import SubAdminSidebar from '@/components/layout/SubAdminSidebar';
import { usePathname } from 'next/navigation';

const SubAdminLayout = ({ children }) => {
    const pathname = usePathname();
    // Add any specific logic for session workspace if needed, similar to trainer layout
    const isSessionWorkspace = pathname?.match(/dashboard\/sub-admin\/sessions\/[^/]+/);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
            {/* Hide Sidebar in session workspace if applicable */}
            {!isSessionWorkspace && (
                <SubAdminSidebar
                    onCollapseChange={setSidebarCollapsed}
                    initialCollapsed={sidebarCollapsed}
                />
            )}

            <div
                className={`flex-1 flex flex-col transition-all duration-300 ${!isSessionWorkspace ? (sidebarCollapsed ? 'md:ml-20' : 'md:ml-72') : ''
                    }`}
            >
                <main className="flex-1">
                    {children}
                </main>

                {/* Footer */}
                {!isSessionWorkspace && (
                    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                                © {new Date().getFullYear()} Funnel Management. All rights reserved.
                            </p>
                        </div>
                    </footer>
                )}
            </div>
        </div>
    );
};

export default SubAdminLayout;
