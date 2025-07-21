import React from 'react';
import Link from 'next/link';
import { HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-9xl font-bold text-primary-600">404</h1>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">页面未找到</h2>
          <p className="mt-2 text-base text-gray-500">
            抱歉，我们找不到您要查找的页面。
          </p>
          <div className="mt-6 flex justify-center space-x-4">
            <Link href="/">
              <span className="btn-primary">
                <HomeIcon className="h-4 w-4 mr-2" />
                回到首页
              </span>
            </Link>
            <button
              onClick={() => window.history.back()}
              className="btn-outline"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              返回
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
