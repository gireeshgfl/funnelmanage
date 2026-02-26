"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users,
  Activity,
  ArrowRight,
  UserCheck,
  Group
} from 'lucide-react';



const ActionButton = ({ title, icon: Icon, href, description }) => (
  <Link href={href}>
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </motion.div>
  </Link>
);

const SubAdminDashboard = () => {


  const actions = [
    { title: 'View Attendance', description: 'Check sessions attended by students', icon: Users, href: '/dashboard/sub-admin/students' },
    { title: 'Assign Trainers', description: 'Assign or reassign trainers to groups', icon: UserCheck, href: '/dashboard/sub-admin/trainers' },
    { title: 'Manage Groups', description: 'Organize and assign student groups', icon: Group, href: '/dashboard/sub-admin/groups' },
  ];


  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Page Title for Context */}
        <div className="mb-6">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold text-gray-900 dark:text-white"
          >
            Dashboard Overview
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 dark:text-gray-400 mt-1"
          >
            Manage students, trainers and groups.
          </motion.p>
        </div>



        <div className="space-y-10">
          {/* Quick Actions */}
          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {actions.map((action, index) => (
                <ActionButton key={index} {...action} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SubAdminDashboard;
