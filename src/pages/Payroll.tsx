import React from 'react';
import { Construction } from 'lucide-react';

export default function Payroll() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-6">
        <Construction className="w-8 h-8 text-neutral-400" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">Payroll Management</h1>
      <p className="text-neutral-400 max-w-md">This module is under development. Check back soon for updates.</p>
    </div>
  );
}
