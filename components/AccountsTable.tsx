import React, { useState, useRef, useLayoutEffect } from 'react';
import { EmailAccount } from '../types';

const ROW_HEIGHT = 65; // Fixed row height for virtualization calculations
const OVERSCAN_COUNT = 5; // Render a few extra rows above/below the viewport for smoother scrolling

interface AccountsTableProps {
  accounts: EmailAccount[];
}

export const AccountsTable = ({ accounts }: AccountsTableProps) => {
  if (accounts.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400 h-[400px] flex flex-col justify-center items-center">
        <p>No accounts match the current filter.</p>
        <p className="text-sm">Try adjusting your search or filter settings.</p>
      </div>
    );
  }

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Using a ref for container height to avoid re-renders on resize
  const containerHeightRef = useRef(0);
  useLayoutEffect(() => {
    if (containerRef.current) {
      containerHeightRef.current = containerRef.current.clientHeight;
    }
  });

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const startIndex = Math.floor(scrollTop / ROW_HEIGHT);
  const visibleRowCount = Math.ceil(containerHeightRef.current / ROW_HEIGHT);
  const endIndex = Math.min(accounts.length - 1, startIndex + visibleRowCount + OVERSCAN_COUNT);

  const visibleAccounts = accounts.slice(startIndex, endIndex + 1);

  return (
    <div ref={containerRef} onScroll={handleScroll} className="overflow-x-auto max-h-[400px] overflow-y-auto pr-2">
      <table className="w-full text-left text-sm text-slate-300 table-fixed">
        <thead className="sticky top-0 bg-slate-800 z-10">
          <tr className="border-b border-slate-700">
            <th className="p-4 w-1/12">ID</th>
            <th className="p-4 w-1/4">Client, Owner, or Provider</th>
            <th className="p-4 w-1/6">Protocol</th>
            <th className="p-4 w-1/4">Email</th>
            <th className="p-4 w-1/3">Error Message</th>
          </tr>
        </thead>
        <tbody style={{ position: 'relative', height: `${accounts.length * ROW_HEIGHT}px` }}>
          {visibleAccounts.map((account, index) => {
            const actualIndex = startIndex + index;
            const top = actualIndex * ROW_HEIGHT;
            return (
              <tr 
                key={account.id} 
                className={`hover:bg-slate-700/50 ${actualIndex % 2 === 1 ? 'bg-slate-800/50' : ''}`}
                style={{
                  position: 'absolute',
                  top: `${top}px`,
                  left: 0,
                  right: 0,
                  height: `${ROW_HEIGHT}px`,
                  display: 'table',
                  width: '100%',
                  tableLayout: 'fixed'
                }}
              >
                <td className="p-4 align-top font-mono text-slate-500 w-1/12 overflow-hidden text-ellipsis whitespace-nowrap border-b border-slate-700">{account.id}</td>
                <td className="p-4 align-top w-1/4 overflow-hidden text-ellipsis whitespace-nowrap border-b border-slate-700">{account.client}</td>
                <td className="p-4 align-top w-1/6 overflow-hidden text-ellipsis whitespace-nowrap border-b border-slate-700">{account.protocol}</td>
                <td className="p-4 align-top font-medium w-1/4 overflow-hidden text-ellipsis whitespace-nowrap border-b border-slate-700">{account.email}</td>
                <td className={`p-4 align-top w-1/3 overflow-hidden text-ellipsis whitespace-nowrap border-b border-slate-700 ${account.error ? 'text-red-400' : 'text-slate-400'}`}>
                  {account.error || 'No issues'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};