import React from 'react';
import dynamic from 'next/dynamic';
import Layout from '../../src/components/Layout/Layout';

// Dynamically import DocumentView to avoid SSR issues
const DocumentView = dynamic(() => import('../../src/pages/DocumentView'), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-64">Loading...</div>
});

const DocumentPage: React.FC = () => {
  return (
    <Layout>
      <DocumentView />
    </Layout>
  );
};

export default DocumentPage;
