'use client';

import { Card } from "@/components/ui/card";

export default function ComplianceChart() {
  // Using a mock to visualize the exact structure from the reference images (Reporting Status by Facility Type: PHC, Sub-Center, Private Hospital, Lab)
  const data = [
    { name: 'PHC', onTime: 720, late: 350, noReport: 80 },
    { name: 'Sub-Center', onTime: 750, late: 320, noReport: 45 },
    { name: 'Private Hosp.', onTime: 620, late: 250, noReport: 220 },
    { name: 'Lab', onTime: 580, late: 120, noReport: 50 },
  ];

  const maxVal = 900; // rough scale max

  return (
    <Card className="h-full border-slate-200 shadow-sm flex flex-col rounded-sm overflow-hidden bg-white">
      <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Reporting Status by Facility Type</h3>
          <p className="text-[10px] text-slate-500 font-medium tracking-wide">Daily compliance breakdown</p>
        </div>
        <div className="flex items-center space-x-3 text-[10px] font-bold text-slate-600 tracking-wider">
          <div className="flex items-center"><div className="w-2.5 h-2.5 bg-[#2563eb] mr-1 rounded-sm"/> On-time</div>
          <div className="flex items-center"><div className="w-2.5 h-2.5 bg-[#f59e0b] mr-1 rounded-sm"/> Late</div>
          <div className="flex items-center"><div className="w-2.5 h-2.5 bg-[#dc2626] mr-1 rounded-sm"/> No-Report</div>
        </div>
      </div>
      <div className="flex-1 p-4 relative pt-6 flex items-end justify-around">
        {/* Y Axis Guide lines */}
        <div className="absolute inset-0 p-4 pt-6 pointer-events-none flex flex-col justify-between z-0">
            {[800, 600, 400, 200, 0].map(val => (
              <div key={val} className="w-full flex items-center h-0">
                 <span className="text-[10px] font-medium text-slate-400 w-6 text-right mr-2">{val}</span>
                 <div className="flex-1 border-t border-slate-100 w-full" />
              </div>
            ))}
        </div>

        {/* Bars */}
        <div className="relative z-10 w-full h-[calc(100%-1.5rem)] flex justify-around items-end pl-8">
            {data.map(item => (
                <div key={item.name} className="flex flex-col items-center flex-1 h-full justify-end">
                    <div className="flex items-end h-[calc(100%-24px)] space-x-1 w-full justify-center px-2">
                        <div className="w-4 bg-[#2563eb] rounded-t-sm transition-all hover:bg-blue-500 hover:brightness-110 cursor-pointer" style={{ height: ((item.onTime/maxVal)*100) + '%' }} title={'On-Time: ' + item.onTime} />
                        <div className="w-4 bg-[#f59e0b] rounded-t-sm transition-all hover:bg-amber-400 hover:brightness-110 cursor-pointer" style={{ height: ((item.late/maxVal)*100) + '%' }} title={'Late: ' + item.late} />
                        <div className="w-4 bg-[#dc2626] rounded-t-sm transition-all hover:bg-red-500 hover:brightness-110 cursor-pointer" style={{ height: ((item.noReport/maxVal)*100) + '%' }} title={'No Report: ' + item.noReport} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 mt-2 truncate w-full text-center">{item.name}</span>
                </div>
            ))}
        </div>
      </div>
    </Card>
  );
}
