import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  DocumentTextIcon,
  CloudArrowUpIcon,
  HomeIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const navigation = [
  { name: '仪表板', href: '/', icon: HomeIcon },
  { name: '上传', href: '/upload', icon: CloudArrowUpIcon },
];

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <Link href="/">
                    <span className="flex items-center space-x-2">
                      <DocumentTextIcon className="h-8 w-8 text-primary-600" />
                      <span className="text-xl font-bold gradient-text">EasyDoc2</span>
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>
        <main className="flex-1">
          {children}
        </main>
        {/* Footer - 固定在页面底部 */}
        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                © 2024 EasyDoc2. 基于 EasyDoc AI 技术驱动.
              </div>
              <div className="flex space-x-6">
                <a href="#" className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200">
                  文档
                </a>
                <a href="#" className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200">
                  支持
                </a>
                <a href="https://easydoc.sh/contact-us" className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200">
                  联系我们
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and main navigation */}
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/">
                  <span className="flex items-center space-x-2">
                    <DocumentTextIcon className="h-8 w-8 text-primary-600" />
                    <span className="text-xl font-bold gradient-text">EasyDoc2</span>
                  </span>
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => {
                  const isActive = router.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                    >
                      <span className={clsx(
                        'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200',
                        isActive
                          ? 'border-primary-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      )}>
                        <item.icon className="h-4 w-4 mr-2" />
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                高级文档处理平台
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-500 transition-colors duration-200">
                <Cog6ToothIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                >
                  <div className={clsx(
                    'block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200',
                    isActive
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  )}>
                    <div className="flex items-center">
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer - 固定在页面底部 */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              © 2024 EasyDoc2. 基于 EasyDoc AI 技术驱动.
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200">
                文档
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200">
                支持
              </a>
              <a href="https://easydoc.sh/contact-us" className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200">
                联系我们
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
