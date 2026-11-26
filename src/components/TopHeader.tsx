import React from 'react';
import {
  PanelLeft,
  Search,
  Download,
  LayoutGrid,
  Table2,
  SlidersHorizontal,
} from 'lucide-react';
import { SubTabId } from '../types/dispatch';

interface TopHeaderProps {
  activeSubTab: SubTabId;
  onSelectSubTab: (tab: SubTabId) => void;
  viewMode: 'table' | 'card';
  onChangeViewMode: (mode: 'table' | 'card') => void;
  groupByCustomer: boolean;
  onToggleGroupByCustomer: () => void;
  onFocusSearch: () => void;
  onExportCsv: () => void;
  onToggleSidebar: () => void;
}

const SUB_TABS: { id: SubTabId; label: string }[] = [
  { id: 'shipments', label: 'Tổng hợp lô hàng' },
  { id: 'dispatch', label: 'Điều xe' },
  { id: 'plan', label: 'Kế hoạch xe' },
  { id: 'freight', label: 'Cước vận chuyển' },
  { id: 'cost', label: 'Chi phí vận chuyển' },
  { id: 'vehicle_cost', label: 'Quản lý chi phí xe' },
  { id: 'fuel_norm', label: 'Định mức dầu chuyến' },
  { id: 'fuel_issue', label: 'Cấp dầu xe' },
];

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeSubTab,
  onSelectSubTab,
  viewMode,
  onChangeViewMode,
  groupByCustomer,
  onToggleGroupByCustomer,
  onFocusSearch,
  onExportCsv,
  onToggleSidebar,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      {/* Row 1: Breadcrumb & Utility Controls */}
      <div className="h-12 px-4 lg:px-6 flex items-center justify-between gap-4 border-b border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            title="Ẩn/hiện thanh điều hướng"
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-sm whitespace-nowrap shrink-0"
          >
            <span className="text-slate-400 font-medium">Điều hành</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-semibold">Điều xe</span>
          </nav>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onFocusSearch}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Tìm kiếm</span>
            <kbd className="ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-200 rounded text-slate-500">
              ⌘K
            </kbd>
          </button>

          <button
            type="button"
            onClick={onExportCsv}
            title="Xuất danh sách chuyến CSV"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Xuất file</span>
          </button>

          <div
            className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center shrink-0 select-none"
            title="Quản lý điều hành"
          >
            Q
          </div>
        </div>
      </div>

      {/* Row 2: Sub-navigation tabs + View mode controls */}
      <div className="px-4 lg:px-6 flex items-center justify-between gap-4 overflow-x-auto">
        <div className="flex items-center gap-1">
          {SUB_TABS.map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectSubTab(tab.id)}
                className={`relative px-3 py-2.5 text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isActive
                    ? 'text-blue-600 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute inset-x-2 bottom-0 h-0.5 bg-blue-600 rounded-t" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 shrink-0 py-1.5">
          {/* Bảng / Thẻ segmented switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
            <button
              type="button"
              onClick={() => onChangeViewMode('table')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table2 className="w-3.5 h-3.5" />
              <span>Bảng</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeViewMode('card')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === 'card'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Thẻ</span>
            </button>
          </div>

          {/* Gom cột toggle */}
          <button
            type="button"
            onClick={onToggleGroupByCustomer}
            className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>Gom nhóm</span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
                groupByCustomer
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              {groupByCustomer ? 'Bật' : 'Tắt'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
