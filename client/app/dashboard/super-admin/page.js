"use client";

import React from 'react';
import Link from 'next/link';

const DashboardPage = () => {
  return (
    <div>
      <div className="flex justify-center mt-12">
        <div className="rounded-lg shadow-xl">
          <h1 className="text-white bg-gray-900 px-4 py-4 text-2xl font-bold rounded-t-lg">
            Super Admin Dashboard
          </h1>
        </div>
      </div>

      <div className="flex justify-center mt-12">
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/dashboard/super-admin/trainers" passHref>
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded">
              Trainers
            </button>
          </Link>
          <Link href="/dashboard/super-admin/sub-admin" passHref>
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded">
              Sub-Admin
            </button>
          </Link>
          <Link href="/dashboard/super-admin/trainer-auth" passHref>
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded">
              New-Request
            </button>
          </Link>
          <Link href="/dashboard/super-admin/create-trainer" passHref>
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded">
              Create-Trainer
            </button>
          </Link>
          <Link href="/dashboard/super-admin/settings" passHref>
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded">
              Settings
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;