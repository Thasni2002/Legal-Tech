import CourtFeeCalView from '@/views/UI/Finance Management/FinanceManagementView';
import React, { Suspense } from 'react';

const Page = () => {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-500 font-bold">Loading Billing & Finance Management...</div>}>
      <CourtFeeCalView/>
    </Suspense>
  );
};

export default Page;
