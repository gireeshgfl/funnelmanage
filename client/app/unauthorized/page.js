"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center dark:bg-gray-900">
            <div className="flex max-w-md flex-col items-center space-y-6 rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800">
                <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/30">
                    <ShieldAlert className="h-12 w-12 text-red-600 dark:text-red-500" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Access Denied
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        You do not have permission to view this page. Please contact your administrator if you believe this is a mistake.
                    </p>
                </div>

                <div className="flex w-full flex-col space-y-3 pt-4">
                    <Link
                        href="/login"
                        className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                    >
                        Return to Home
                    </Link>
                </div>
            </div>

            <div className="mt-8 text-xs text-gray-400">
                Error Code: 403 Forbidden
            </div>
        </div>
    );
}
