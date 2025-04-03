import React from 'react';
import { withAuth } from './middleware';

const ProtectedPage = () => {
  return <div>This is a protected page.</div>;
};

export default withAuth(ProtectedPage);
