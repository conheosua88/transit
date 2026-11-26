import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  Columns3,
  Filter,
  Link2,
  Search,
  Truck,
  X,
  CheckCircle2,
  RotateCcw,
  TableProperties,
  AlertTriangle,
} from 'lucide-react';
import { INITIAL_TRIPS } from './data/initialTrips';
import {
  FleetType,
  KpiFilterType,
  MergeDispatchPayload,
  SubTabId,
  Trip,
} from './types/dispatch';
import {
  buildDispatchPlanSummary,
  classifyTrips,
} from './utils/dispatchClassification';
import { TopHeader } from './components/TopHeader';
import { KpiStrip } from './components/KpiStrip';
import { DispatchPlanSummary } from './components/DispatchPlanSummary';
import {
  DispatchTable,
  SortDirection,
  SortField,
} from './components/DispatchTable';
import { MergeTripModal } from './components/MergeTripModal';
import { TripDetailModal, TripFormModal } from './components/TripFormModal';

export default function App() {
  const [trips, setTrips] = useState<Trip[]>(INITIAL_TRIPS);
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>('dispatch');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [groupByCustomer, setGroupByCustomer] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPlanSummary, setShowPlanSummary] = useState(true);

  // Filters & sorting
  const [kpiFilter, setKpiFilter] = useState<KpiFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [containerFilter, setContainerFilter] = useState<'all' | '20' | '40'>('all');
  const [dateFilterActive, setDateFilterActive] = useState(true);
  const [sortField, setSortField] = useState<SortField | null>('plateNumber');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Column visibility popover
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    vehicleOwner: true,
    plateNumber: true,
    trailerNumber: true,
    driverPhone: true,
    billBooking: true,
    ops: true,
  });

  // Selection & Modals
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [viewingTrip, setViewingTrip] = useState<Trip | null>(null);

  // Toast feedback
  const [toast, setToast] = useState<{
    message: string;
    variant: 'success' | 'warning';
  } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const showToast = (
    message: string,
    variant: 'success' | 'warning' = 'success'
  ) => {
    setToast({ message, variant });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Classify trips dynamically into Ghép / Quay vòng / Cắt mooc / Single
  const classification = useMemo(() => classifyTrips(trips), [trips]);

  const planSummary = useMemo(
    () => buildDispatchPlanSummary(trips, classification),
    [trips, classification]
  );

  // KPI metrics
  const stats = useMemo(() => {
    const totalCount = trips.length;
    const dispatchedCount = trips.filter((t) => t.isDispatched).length;
    const undispatchedCount = trips.filter((t) => !t.isDispatched).length;
    const companyCount = trips.filter((t) => t.fleetType === 'company').length;
    const hiredCount = trips.filter((t) => t.fleetType === 'hired').length;
    const eligible20Count = trips.filter(
      (t) => t.containerType.startsWith("20'") && !t.mergeGroupId
    ).length;

    return {
      totalCount,
      dispatchedCount,
      undispatchedCount,
      companyCount,
      hiredCount,
      mergedPairsCount: planSummary.mergeTotal,
      quayVongCount: planSummary.quayVongTotal,
      catMoocCount: planSummary.catMoocTotal,
      eligible20Count,
    };
  }, [trips, planSummary]);

  // Filtered & sorted list
  const filteredTrips = useMemo(() => {
    let list = [...trips];

    if (kpiFilter === 'dispatched') {
      list = list.filter((t) => t.isDispatched);
    } else if (kpiFilter === 'undispatched') {
      list = list.filter((t) => !t.isDispatched);
    } else if (kpiFilter === 'company') {
      list = list.filter((t) => t.fleetType === 'company');
    } else if (kpiFilter === 'hired') {
      list = list.filter((t) => t.fleetType === 'hired');
    } else if (kpiFilter === 'merged') {
      list = list.filter((t) => classification[t.id]?.mode === 'merge');
    } else if (kpiFilter === 'quay_vong') {
      list = list.filter((t) => classification[t.id]?.mode === 'quay_vong');
    } else if (kpiFilter === 'cat_mooc') {
      list = list.filter((t) => classification[t.id]?.mode === 'cat_mooc');
    }

    if (containerFilter === '20') {
      list = list.filter((t) => t.containerType.startsWith("20'"));
    } else if (containerFilter === '40') {
      list = list.filter((t) => t.containerType.startsWith("40'"));
    }

    if (dateFilterActive) {
      list = list.filter((t) => t.dispatchDate === '25/11/2026');
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.jobCode.toLowerCase().includes(q) ||
          t.plateNumber.toLowerCase().includes(q) ||
          t.trailerNumber.toLowerCase().includes(q) ||
          t.driverName.toLowerCase().includes(q) ||
          t.containerNumber.toLowerCase().includes(q) ||
          t.billBooking.toLowerCase().includes(q) ||
          t.customer.toLowerCase().includes(q) ||
          t.route.toLowerCase().includes(q) ||
          t.note.toLowerCase().includes(q)
      );
    }

    if (sortField) {
      list.sort((a, b) => {
        let comparison = 0;
        if (sortField === 'weight') {
          comparison = (a.weight ?? -1) - (b.weight ?? -1);
        } else if (sortField === 'plateNumber') {
          const plateA = a.plateNumber.trim().toUpperCase();
          const plateB = b.plateNumber.trim().toUpperCase();
          // Dispatched vehicles first, undispatched (empty plate) at the bottom
          if (!plateA && plateB) return 1;
          if (plateA && !plateB) return -1;
          comparison = plateA.localeCompare(plateB, 'vi');
          if (comparison === 0) {
            comparison = a.id.localeCompare(b.id, 'vi');
          }
          return sortDirection === 'asc' ? comparison : -comparison;
        } else {
          comparison = String(a[sortField] ?? '').localeCompare(
            String(b[sortField] ?? ''),
            'vi'
          );
        }
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return list;
  }, [
    trips,
    classification,
    kpiFilter,
    containerFilter,
    dateFilterActive,
    searchQuery,
    sortField,
    sortDirection,
  ]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    const visibleIds = filteredTrips.map((t) => t.id);
    const allChecked =
      visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
    if (allChecked) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds(Array.from(new Set([...selectedIds, ...visibleIds])));
    }
  };

  const handleConfirmMerge = (payload: MergeDispatchPayload) => {
    const {
      container1Id,
      container2Id,
      vehicleOwner,
      plateNumber,
      trailerNumber,
      driverName,
      driverPhone,
    } = payload;

    const groupId = `MG-${Date.now()}`;
    const fleetType = vehicleOwner.toLowerCase().includes('nhà')
      ? 'company'
      : 'hired';

    setTrips((prev) => {
      const trip1 = prev.find((t) => t.id === container1Id);
      const trip2 = prev.find((t) => t.id === container2Id);
      if (!trip1 || !trip2) return prev;

      const updatedTrip1: Trip = {
        ...trip1,
        vehicleOwner,
        fleetType,
        plateNumber,
        trailerNumber,
        driverName,
        driverPhone,
        isDispatched: true,
        mergeGroupId: groupId,
        mergePartnerId: container2Id,
      };

      const updatedTrip2: Trip = {
        ...trip2,
        vehicleOwner,
        fleetType,
        plateNumber,
        trailerNumber,
        driverName,
        driverPhone,
        isDispatched: true,
        mergeGroupId: groupId,
        mergePartnerId: container1Id,
      };

      // Place the merged pair consecutively at the position of the earliest selected row
      const remaining = prev.filter(
        (t) => t.id !== container1Id && t.id !== container2Id
      );
      const firstIdx = Math.min(
        prev.findIndex((t) => t.id === container1Id),
        prev.findIndex((t) => t.id === container2Id)
      );
      const insertAt = Math.max(0, Math.min(firstIdx, remaining.length));
      remaining.splice(insertAt, 0, updatedTrip1, updatedTrip2);
      return remaining;
    });

    setSelectedIds([]);
    setIsMergeModalOpen(false);
    showToast(
      `Đã ghép thành công ${container1Id} và ${container2Id} lên xe ${plateNumber}.`
    );
  };

  const handleUnmergePair = (mergeGroupId: string) => {
    setTrips((prev) =>
      prev.map((t) =>
        t.mergeGroupId === mergeGroupId
          ? {
              ...t,
              mergeGroupId: null,
              mergePartnerId: null,
            }
          : t
      )
    );
    showToast('Đã tách cặp chuyến ghép.');
  };

  const handleSaveTrip = (savedTrip: Trip) => {
    setTrips((prev) => {
      const exists = prev.some((t) => t.id === savedTrip.id);
      if (exists) {
        return prev.map((t) => (t.id === savedTrip.id ? savedTrip : t));
      }
      return [savedTrip, ...prev];
    });
    setIsFormModalOpen(false);
    setEditingTrip(null);
    showToast(
      editingTrip
        ? `Đã cập nhật chuyến ${savedTrip.id}.`
        : `Đã thêm chuyến mới ${savedTrip.id}.`
    );
  };

  const handleAssignVehicle = (
    tripId: string,
    payload: {
      plateNumber: string;
      vehicleOwner: string;
      fleetType: FleetType;
      driverName: string;
      driverPhone: string;
    }
  ) => {
    const target = trips.find((t) => t.id === tripId);
    if (!target) return;

    const isClearing = !payload.plateNumber;
    const targetPlate = payload.plateNumber.trim().toUpperCase();
    const matchIds = target.mergeGroupId
      ? trips
          .filter((t) => t.mergeGroupId === target.mergeGroupId)
          .map((t) => t.id)
      : [tripId];

    // Check if the chosen truck is already in a Cắt mooc group and current trailer collides
    const existingPeers = !isClearing && !target.mergeGroupId
      ? trips.filter(
          (t) =>
            t.id !== tripId &&
            !t.mergeGroupId &&
            t.isDispatched &&
            t.dispatchDate === target.dispatchDate &&
            t.plateNumber.trim().toUpperCase() === targetPlate &&
            t.trailerNumber.trim() !== ''
        )
      : [];
    const peerTrailers = Array.from(
      new Set(existingPeers.map((t) => t.trailerNumber.trim().toUpperCase()))
    );
    const currentMooc = target.trailerNumber.trim().toUpperCase();
    const hasCatMoocCollision =
      peerTrailers.length > 1 && Boolean(currentMooc) && peerTrailers.includes(currentMooc);

    setTrips((prev) =>
      prev.map((t) =>
        matchIds.includes(t.id)
          ? {
              ...t,
              plateNumber: payload.plateNumber,
              trailerNumber: isClearing || hasCatMoocCollision ? '' : t.trailerNumber,
              vehicleOwner: payload.vehicleOwner,
              fleetType: payload.fleetType,
              driverName: payload.driverName,
              driverPhone: payload.driverPhone,
              isDispatched: !isClearing,
            }
          : t
      )
    );

    if (isClearing) {
      showToast(`Đã bỏ gán xe cho ${tripId}.`);
    } else if (hasCatMoocCollision || !target.trailerNumber) {
      showToast(`Đã gán xe ${payload.plateNumber} cho ${tripId}. Tiếp tục chọn số mooc.`);
    } else {
      showToast(`Đã gán xe ${payload.plateNumber} cho ${tripId}.`);
    }
  };

  const handleAssignTrailer = (tripId: string, trailerNumber: string): boolean => {
    const target = trips.find((t) => t.id === tripId);
    if (!target) return false;

    const cleanMooc = trailerNumber.trim().toUpperCase();
    const targetPlate = target.plateNumber.trim().toUpperCase();

    if (cleanMooc && !target.mergeGroupId && targetPlate) {
      const samePlatePeers = trips.filter(
        (t) =>
          t.id !== tripId &&
          !t.mergeGroupId &&
          t.isDispatched &&
          t.dispatchDate === target.dispatchDate &&
          t.plateNumber.trim().toUpperCase() === targetPlate &&
          t.trailerNumber.trim() !== ''
      );
      const peerTrailers = Array.from(
        new Set(samePlatePeers.map((t) => t.trailerNumber.trim().toUpperCase()))
      );
      if (peerTrailers.length > 1 && peerTrailers.includes(cleanMooc)) {
        return false;
      }
    }

    const matchIds = target.mergeGroupId
      ? trips
          .filter((t) => t.mergeGroupId === target.mergeGroupId)
          .map((t) => t.id)
      : [tripId];

    const updatedTrips = trips.map((t) =>
      matchIds.includes(t.id) ? { ...t, trailerNumber: cleanMooc } : t
    );
    setTrips(updatedTrips);

    if (!cleanMooc) {
      showToast(`Đã bỏ chọn mooc cho ${tripId}.`);
      return true;
    }

    const nextClassification = classifyTrips(updatedTrips);
    const nextMode = nextClassification[tripId]?.mode;
    const modeTag =
      nextMode === 'quay_vong'
        ? ' → Quay vòng'
        : nextMode === 'cat_mooc'
        ? ' → Cắt mooc'
        : '';
    showToast(`Đã gán mooc ${cleanMooc} cho ${tripId}${modeTag}.`);
    return true;
  };

  const handleExportCsv = () => {
    const modeLabelMap = {
      merge: 'Ghép',
      quay_vong: 'Quay vòng',
      cat_mooc: 'Cắt mooc',
      single: 'Đơn',
    };
    const headers = [
      'Mã chuyến',
      'Hình thức',
      'Chủ xe',
      'Số xe',
      'Số mooc',
      'Lái xe',
      'SĐT',
      'Loại container',
      'Số container',
      'Bill / Booking',
      'Chủ hàng',
      'Ops',
      'Tuyến đường',
      'Trọng lượng',
      'CDS cutoff',
      'Ghép với',
    ];
    const rows = filteredTrips.map((t) => [
      t.id,
      modeLabelMap[classification[t.id]?.mode ?? 'single'],
      t.vehicleOwner,
      t.plateNumber,
      t.trailerNumber,
      t.driverName,
      t.driverPhone,
      t.containerType,
      t.containerNumber,
      t.billBooking,
      t.customer,
      t.ops,
      t.route,
      t.weight ?? '',
      t.cdsCutoff,
      t.mergePartnerId ?? '',
    ]);
    const csv = [headers, ...rows]
      .map((r) =>
        r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dieu-xe-25-11-2026.csv';
    link.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất danh sách chuyến điều xe (.csv).');
  };

  const viewingClassification = viewingTrip
    ? classification[viewingTrip.id]
    : null;
  const viewingMode = viewingClassification?.mode ?? 'single';
  const viewingGroupTrips = useMemo(() => {
    if (!viewingTrip) return [];
    const groupKey = classification[viewingTrip.id]?.groupKey;
    if (!groupKey) return [viewingTrip];
    return trips.filter((t) => classification[t.id]?.groupKey === groupKey);
  }, [viewingTrip, trips, classification]);

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-slate-900 flex">
      {/* Optional Collapsible Left Navigation Rail */}
      {sidebarOpen && (
        <aside className="w-56 bg-white border-r border-slate-200 shrink-0 hidden md:flex flex-col">
          <div className="h-12 px-4 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <Truck className="w-4 h-4 text-blue-600" />
              <span>TMS Logistics</span>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <nav className="p-3 space-y-1 text-xs font-medium">
            {[
              { id: 'shipments' as SubTabId, label: 'Tổng hợp lô hàng' },
              { id: 'dispatch' as SubTabId, label: 'Điều xe & Ghép chuyến' },
              { id: 'plan' as SubTabId, label: 'Kế hoạch xe' },
              { id: 'freight' as SubTabId, label: 'Cước vận chuyển' },
              { id: 'cost' as SubTabId, label: 'Chi phí vận chuyển' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSubTab(item.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  activeSubTab === item.id
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <TopHeader
          activeSubTab={activeSubTab}
          onSelectSubTab={setActiveSubTab}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          groupByCustomer={groupByCustomer}
          onToggleGroupByCustomer={() => setGroupByCustomer((v) => !v)}
          onFocusSearch={() => searchInputRef.current?.focus()}
          onExportCsv={handleExportCsv}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
        />

        <main className="flex-1 px-4 lg:px-6 py-4 space-y-3.5 max-w-[1600px] w-full mx-auto">
          {activeSubTab !== 'dispatch' ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
              <h2 className="text-base font-bold text-slate-900">
                Phân hệ{' '}
                {
                  {
                    shipments: 'Tổng hợp lô hàng',
                    plan: 'Kế hoạch xe',
                    freight: 'Cước vận chuyển',
                    cost: 'Chi phí vận chuyển',
                    vehicle_cost: 'Quản lý chi phí xe',
                    fuel_norm: 'Định mức dầu chuyến',
                    fuel_issue: 'Cấp dầu xe',
                    dispatch: 'Điều xe',
                  }[activeSubTab]
                }
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Hiện đang có {stats.totalCount} chuyến trong ngày 25/11/2026 (gồm{' '}
                {stats.mergedPairsCount} cặp ghép, {stats.quayVongCount} quay vòng,{' '}
                {stats.catMoocCount} cắt mooc). Quay lại màn Điều xe để thao tác.
              </p>
              <button
                type="button"
                onClick={() => setActiveSubTab('dispatch')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
              >
                Quay lại màn Điều xe
              </button>
            </div>
          ) : (
            <>
              {/* KPI Strip (includes Ghép, Quay vòng, Cắt mooc) */}
              <KpiStrip
                totalCount={stats.totalCount}
                dispatchedCount={stats.dispatchedCount}
                undispatchedCount={stats.undispatchedCount}
                companyCount={stats.companyCount}
                hiredCount={stats.hiredCount}
                mergedPairsCount={stats.mergedPairsCount}
                quayVongCount={stats.quayVongCount}
                catMoocCount={stats.catMoocCount}
                activeFilter={kpiFilter}
                onSelectFilter={setKpiFilter}
              />

              {/* Phương án điều xe thực hiện (Ghép | Quay vòng | Cắt mooc) */}
              {showPlanSummary && (
                <DispatchPlanSummary
                  summary={planSummary}
                  dateLabel="25/11/2026"
                  activeFilter={kpiFilter}
                  onFilterMode={setKpiFilter}
                  onClose={() => setShowPlanSummary(false)}
                />
              )}

              {/* Toolbar Row */}
              <div className="bg-white rounded-xl border border-slate-200 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3">
                {/* Left Filters */}
                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                  {/* Search input */}
                  <div className="relative w-full sm:w-64">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm mã chuyến, bill/booking, biển số, số cont..."
                      className="w-full pl-3 pr-8 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    {searchQuery ? (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    )}
                  </div>

                  {/* Date range button */}
                  <button
                    type="button"
                    onClick={() => setDateFilterActive((v) => !v)}
                    title="Bật/tắt lọc ngày 25/11/2026"
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono tabular-nums rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      dateFilterActive
                        ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        : 'bg-slate-100 border-slate-200 text-slate-500'
                    }`}
                  >
                    <span>
                      {dateFilterActive ? '25/11/2026 → 25/11/2026' : 'Tất cả ngày'}
                    </span>
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Container size quick filter */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/70">
                    {(
                      [
                        { id: 'all', label: 'Tất cả' },
                        { id: '20', label: "Cont 20'" },
                        { id: '40', label: "Cont 40'" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setContainerFilter(opt.id)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                          containerFilter === opt.id
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Column Visibility Popover */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowColumnMenu((v) => !v)}
                      title="Tùy chỉnh cột hiển thị"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <Columns3 className="w-3.5 h-3.5 text-slate-500" />
                      <span className="hidden xl:inline">Cột</span>
                    </button>

                    {showColumnMenu && (
                      <div className="absolute left-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-40 space-y-1 text-xs">
                        <div className="px-2 py-1 font-semibold text-slate-700 border-b border-slate-100">
                          Hiển thị cột
                        </div>
                        {[
                          { key: 'vehicleOwner', label: 'Chủ xe' },
                          { key: 'plateNumber', label: 'Số xe' },
                          { key: 'trailerNumber', label: 'Số mooc' },
                          { key: 'driverPhone', label: 'SĐT lái xe' },
                          { key: 'billBooking', label: 'Bill / Booking' },
                          { key: 'ops', label: 'Ops phụ trách' },
                        ].map((col) => (
                          <label
                            key={col.key}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={visibleColumns[col.key]}
                              onChange={() =>
                                setVisibleColumns((prev) => ({
                                  ...prev,
                                  [col.key]: !prev[col.key],
                                }))
                              }
                              className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600"
                            />
                            <span className="text-slate-700">{col.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Toggle Phương án điều xe summary */}
                  <button
                    type="button"
                    onClick={() => setShowPlanSummary((v) => !v)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
                      showPlanSummary
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <TableProperties className="w-3.5 h-3.5" />
                    <span>Phương án</span>
                  </button>

                  {/* Active filter quick reset */}
                  {(kpiFilter !== 'all' || containerFilter !== 'all' || searchQuery) && (
                    <button
                      type="button"
                      onClick={() => {
                        setKpiFilter('all');
                        setContainerFilter('all');
                        setSearchQuery('');
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
                    >
                      <Filter className="w-3 h-3" />
                      <span>Xóa lọc</span>
                    </button>
                  )}
                </div>

                {/* Right Primary Actions: "Ghép chuyến" */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setTrips(INITIAL_TRIPS);
                      setSelectedIds([]);
                      showToast('Đã khôi phục dữ liệu mẫu.');
                    }}
                    title="Khôi phục dữ liệu mẫu"
                    className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Đặt lại</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsMergeModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-amber-900 bg-[#FEF3D6] hover:bg-[#FDE6AE] border border-amber-400 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
                  >
                    <Link2 className="w-3.5 h-3.5 text-amber-800" />
                    <span>Ghép chuyến</span>
                    <span className="ml-0.5 px-1.5 py-0.2 rounded bg-white/80 text-[11px] font-mono tabular-nums text-amber-900 border border-amber-300/80">
                      {stats.eligible20Count}
                    </span>
                  </button>
                </div>
              </div>

              {/* Dispatch Data Table */}
              <DispatchTable
                trips={filteredTrips}
                allTrips={trips}
                classification={classification}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onToggleSelectAll={handleToggleSelectAll}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
                viewMode={viewMode}
                groupByCustomer={groupByCustomer}
                visibleColumns={visibleColumns}
                onEditTrip={(trip) => {
                  setEditingTrip(trip);
                  setIsFormModalOpen(true);
                }}
                onViewTrip={(trip) => setViewingTrip(trip)}
                onUnmergePair={handleUnmergePair}
                onAssignVehicle={handleAssignVehicle}
                onAssignTrailer={handleAssignTrailer}
              />
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      <MergeTripModal
        isOpen={isMergeModalOpen}
        trips={trips}
        preselectedIds={selectedIds}
        onClose={() => setIsMergeModalOpen(false)}
        onConfirmMerge={handleConfirmMerge}
      />

      <TripFormModal
        isOpen={isFormModalOpen}
        initialTrip={editingTrip}
        allTrips={trips}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingTrip(null);
        }}
        onSave={handleSaveTrip}
      />

      <TripDetailModal
        trip={viewingTrip}
        groupTrips={viewingGroupTrips}
        mode={viewingMode}
        onClose={() => setViewingTrip(null)}
        onUnmergePair={handleUnmergePair}
      />

      {/* Toast feedback */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium shadow-lg border ${
            toast.variant === 'warning'
              ? 'bg-rose-950 text-rose-50 border-rose-700'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          {toast.variant === 'warning' ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
