import React from 'react';

const Skeleton = ({ className }) => {
  return (
    <div className={`animate-pulse bg-pink-100 rounded-xl ${className}`}></div>
  );
};

export const TableSkeleton = ({ rows = 5, columns = 5 }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-pink-50">
              {Array(columns).fill(0).map((_, i) => (
                <th key={i} className="p-4"><Skeleton className="h-4 w-24" /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array(rows).fill(0).map((_, rowIndex) => (
              <tr key={rowIndex} className="border-b border-pink-50">
                {Array(columns).fill(0).map((_, colIndex) => (
                  <td key={colIndex} className="p-4">
                    <Skeleton className="h-6 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const CardSkeleton = () => {
  return (
    <div className="kitty-card flex flex-col overflow-hidden h-[340px]">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="p-5 flex-1 flex flex-col gap-3">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-1/3 rounded-full" />
          <Skeleton className="h-5 w-1/4 rounded-full" />
        </div>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="mt-auto border-t border-pink-50 pt-4 flex justify-between">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-6 w-1/3" />
        </div>
      </div>
    </div>
  );
};

export default Skeleton;
