import React from 'react';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Truck,
  ArrowLeftRight,
  Link2,
  Repeat,
  Scissors,
} from 'lucide-react';
import { KpiFilterType } from '../types/dispatch';

interface KpiStripProps {
  totalCount: number;
  dispatchedCount: number;
  undispatchedCount: number;
  companyCount: number;
  hiredCount: number;
  mergedPairsCount: number;
  quayVongCount: number;
  catMoocCount: number;
  activeFilter: KpiFilterType;
  onSelectFilter: (filter: KpiFilterType) => void;
}

export const KpiStrip: React.FC<KpiStripProps> = ({
  totalCount,
  dispatchedCount,
  undispatchedCount,
  companyCount,
  hiredCount,
  mergedPairsCount,
  quayVongCount,
  catMoocCount,
  activeFilter,
  onSelectFilter,
}) => {
  const cards: {
    id: KpiFilterType;
    label: string;
    value: number;
    hint?: string;
    icon: React.ReactNode;
    iconBg: string;
    valueColor: string;
    activeRing: string;
  }[] = [
    {
      id: 'all',
      label: 'Tổng số chuyến',
      value: totalCount,
      icon: <ClipboardList className="w-4 h-4 text-blue-600" />,
      iconBg: 'bg-blue-50 border-blue-100',
      valueColor: 'text-blue-600',
      activeRing: 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500/20',
    },
    {
      id: 'dispatched',
      label: 'Đã điều xe',
      value: dispatchedCount,
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      iconBg: 'bg-emerald-50 border-emerald-100',
      valueColor: 'text-emerald-700',
      activeRing: 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/20',
    },
    {
      id: 'undispatched',
      label: 'Chưa điều xe',
      value: undispatchedCount,
      icon: <Clock className="w-4 h-4 text-rose-600" />,
      iconBg: 'bg-rose-50 border-rose-100',
      valueColor: 'text-rose-600',
      activeRing: 'border-rose-500 bg-rose-50/40 ring-1 ring-rose-500/20',
    },
    {
      id: 'company',
      label: 'Xe nhà',
      value: companyCount,
      icon: <Truck className="w-4 h-4 text-teal-600" />,
      iconBg: 'bg-teal-50 border-teal-100',
      valueColor: 'text-teal-700',
      activeRing: 'border-teal-500 bg-teal-50/40 ring-1 ring-teal-500/20',
    },
    {
      id: 'hired',
      label: 'Xe thuê',
      value: hiredCount,
      icon: <ArrowLeftRight className="w-4 h-4 text-amber-600" />,
      iconBg: 'bg-amber-50 border-amber-100',
      valueColor: 'text-amber-700',
      activeRing: 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500/20',
    },
    {
      id: 'merged',
      label: 'Ghép (cặp 20\')',
      value: mergedPairsCount,
      icon: <Link2 className="w-4 h-4 text-amber-900" />,
      iconBg: 'bg-[#FCE49C] border-amber-300',
      valueColor: 'text-amber-800',
      activeRing: 'border-amber-500 bg-[#FCE49C]/70 ring-1 ring-amber-500/30',
    },
    {
      id: 'quay_vong',
      label: 'Quay vòng',
      value: quayVongCount,
      icon: <Repeat className="w-4 h-4 text-indigo-700" />,
      iconBg: 'bg-[#D6E0FF] border-indigo-300',
      valueColor: 'text-indigo-700',
      activeRing: 'border-indigo-500 bg-[#D6E0FF]/70 ring-1 ring-indigo-500/30',
    },
    {
      id: 'cat_mooc',
      label: 'Cắt mooc',
      value: catMoocCount,
      icon: <Scissors className="w-4 h-4 text-cyan-800" />,
      iconBg: 'bg-[#BEEAF5] border-cyan-300',
      valueColor: 'text-cyan-800',
      activeRing: 'border-cyan-500 bg-[#BEEAF5]/70 ring-1 ring-cyan-500/30',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
      {cards.map((card) => {
        const isActive = activeFilter === card.id;
        return (
          <button
            key={card.id}
            type="button"
            onClick={() =>
              onSelectFilter(isActive && card.id !== 'all' ? 'all' : card.id)
            }
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all cursor-pointer min-w-0 ${
              isActive
                ? card.activeRing
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${card.iconBg}`}
            >
              {card.icon}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-slate-500 truncate">
                {card.label}
              </div>
              <div
                className={`text-lg font-bold leading-tight tabular-nums ${card.valueColor}`}
              >
                {card.value}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
