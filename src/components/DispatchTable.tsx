import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpDown,
  ChevronDown,
  Eye,
  Link2,
  MapPin,
  Pencil,
  Repeat,
  Scissors,
  Truck,
  Unlink,
  X,
} from 'lucide-react';
import { DispatchMode, FleetType, Trip } from '../types/dispatch';
import { TRAILER_PRESETS, VEHICLE_PRESETS } from '../data/initialTrips';
import { TripClassificationInfo } from '../utils/dispatchClassification';

export type SortField =
  | 'id'
  | 'plateNumber'
  | 'containerType'
  | 'customer'
  | 'weight'
  | 'cdsCutoff';
export type SortDirection = 'asc' | 'desc';

interface DispatchTableProps {
  trips: Trip[];
  allTrips: Trip[];
  classification: Record<string, TripClassificationInfo>;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  sortField: SortField | null;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  viewMode: 'table' | 'card';
  groupByCustomer: boolean;
  visibleColumns: Record<string, boolean>;
  onEditTrip: (trip: Trip) => void;
  onViewTrip: (trip: Trip) => void;
  onUnmergePair: (mergeGroupId: string) => void;
  onAssignVehicle: (
    tripId: string,
    payload: {
      plateNumber: string;
      vehicleOwner: string;
      fleetType: FleetType;
      driverName: string;
      driverPhone: string;
    }
  ) => void;
  onAssignTrailer: (tripId: string, trailerNumber: string) => boolean;
}

const MODE_ROW_STYLES: Record<
  Exclude<DispatchMode, 'single'>,
  {
    rowBg: string;
    cardBorder: string;
    iconBg: string;
    bracketColor: string;
    label: string;
  }
> = {
  merge: {
    rowBg: 'bg-[#FCE49C] hover:bg-[#FAD97A]',
    cardBorder: 'border-amber-400',
    iconBg: 'bg-amber-400 text-amber-950',
    bracketColor: 'border-amber-800',
    label: 'Ghép',
  },
  quay_vong: {
    rowBg: 'bg-[#D6E0FF] hover:bg-[#C4D2FE]',
    cardBorder: 'border-indigo-400',
    iconBg: 'bg-indigo-500 text-white',
    bracketColor: 'border-indigo-700',
    label: 'Quay vòng',
  },
  cat_mooc: {
    rowBg: 'bg-[#BEEAF5] hover:bg-[#A6DFEE]',
    cardBorder: 'border-cyan-500',
    iconBg: 'bg-cyan-600 text-white',
    bracketColor: 'border-cyan-800',
    label: 'Cắt mooc',
  },
};

export const DispatchTable: React.FC<DispatchTableProps> = ({
  trips,
  allTrips,
  classification,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  sortField,
  sortDirection,
  onSort,
  viewMode,
  groupByCustomer,
  visibleColumns,
  onEditTrip,
  onViewTrip,
  onUnmergePair,
  onAssignVehicle,
  onAssignTrailer,
}) => {
  const [activePopover, setActivePopover] = useState<{
    type: 'vehicle' | 'trailer';
    tripId: string;
    top: number;
    left: number;
  } | null>(null);
  const [customInput, setCustomInput] = useState('');
  const [pendingTrailerTripId, setPendingTrailerTripId] = useState<string | null>(
    null
  );

  const popoverRef = useRef<HTMLDivElement>(null);
  const trailerBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (!activePopover) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setActivePopover(null);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActivePopover(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [activePopover]);

  // After assigning a truck to a trip without a mooc, automatically open the mooc picker at its new sorted row position
  useEffect(() => {
    if (!pendingTrailerTripId) return;
    const btn = trailerBtnRefs.current[pendingTrailerTripId];
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const top = Math.min(rect.bottom + 4, window.innerHeight - 320);
      const left = Math.min(rect.left, window.innerWidth - 290);
      setActivePopover({
        type: 'trailer',
        tripId: pendingTrailerTripId,
        top: Math.max(12, top),
        left: Math.max(12, left),
      });
      setCustomInput('');
    }
    setPendingTrailerTripId(null);
  }, [pendingTrailerTripId, trips]);

  const openCellPopover = (
    type: 'vehicle' | 'trailer',
    tripId: string,
    el: HTMLElement
  ) => {
    if (activePopover?.type === type && activePopover?.tripId === tripId) {
      setActivePopover(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    const estimatedHeight = 320;
    const top =
      rect.bottom + estimatedHeight > window.innerHeight
        ? Math.max(12, rect.top - estimatedHeight - 4)
        : rect.bottom + 4;
    const left = Math.min(rect.left, window.innerWidth - 300);
    setCustomInput('');
    setActivePopover({
      type,
      tripId,
      top,
      left: Math.max(12, left),
    });
  };

  const allKnownTrailers = useMemo(() => {
    const fromTrips = allTrips
      .map((t) => t.trailerNumber.trim().toUpperCase())
      .filter(Boolean);
    return Array.from(new Set([...TRAILER_PRESETS, ...fromTrips]));
  }, [allTrips]);
  // Keep grouped pairs (Ghép, Quay vòng, Cắt mooc) adjacent in order
  const orderedTrips = useMemo(() => {
    const visited = new Set<string>();
    const result: Trip[] = [];

    for (const trip of trips) {
      if (visited.has(trip.id)) continue;
      const info = classification[trip.id];
      if (info?.groupKey) {
        const groupMembers = trips.filter(
          (t) => classification[t.id]?.groupKey === info.groupKey
        );
        for (const member of groupMembers) {
          if (!visited.has(member.id)) {
            visited.add(member.id);
            result.push(member);
          }
        }
      } else {
        visited.add(trip.id);
        result.push(trip);
      }
    }
    return result;
  }, [trips, classification]);

  const totalWeight = useMemo(
    () => orderedTrips.reduce((sum, t) => sum + (t.weight ?? 0), 0),
    [orderedTrips]
  );

  const allSelected =
    orderedTrips.length > 0 &&
    orderedTrips.every((t) => selectedIds.includes(t.id));

  const getRowGroupMeta = (trip: Trip, index: number, list: Trip[]) => {
    const info = classification[trip.id];
    const mode: DispatchMode = info?.mode ?? 'single';
    const groupKey = info?.groupKey ?? null;
    const isGrouped = mode !== 'single' && Boolean(groupKey);

    const prevKey = index > 0 ? classification[list[index - 1].id]?.groupKey : null;
    const nextKey =
      index < list.length - 1 ? classification[list[index + 1].id]?.groupKey : null;

    const hasPrevSame = isGrouped && prevKey === groupKey;
    const hasNextSame = isGrouped && nextKey === groupKey;

    const partner =
      mode === 'merge' && trip.mergePartnerId
        ? allTrips.find((t) => t.id === trip.mergePartnerId) ?? null
        : null;

    return {
      mode,
      isGrouped,
      isFirst: isGrouped && !hasPrevSame && hasNextSame,
      isMiddle: isGrouped && hasPrevSame && hasNextSame,
      isLast: isGrouped && hasPrevSame && !hasNextSame,
      peerIds: info?.peerTripIds ?? [],
      partner,
      style: mode !== 'single' ? MODE_ROW_STYLES[mode] : null,
    };
  };

  const renderModeIcon = (
    mode: DispatchMode,
    peerIds: string[],
    partner: Trip | null,
    hasWarning?: boolean
  ) => {
    if (mode === 'merge') {
      return (
        <span
          title={`Ghép cont 20' với ${partner?.id ?? peerIds.join(', ')}`}
          className={`inline-flex items-center justify-center w-5 h-5 rounded shrink-0 ${MODE_ROW_STYLES.merge.iconBg}`}
        >
          <Link2 className="w-3 h-3" />
        </span>
      );
    }
    if (mode === 'quay_vong') {
      return (
        <span
          title={`Quay vòng (cùng xe & cùng mooc) với ${peerIds.join(', ')}`}
          className={`inline-flex items-center justify-center w-5 h-5 rounded shrink-0 ${MODE_ROW_STYLES.quay_vong.iconBg}`}
        >
          <Repeat className="w-3 h-3" />
        </span>
      );
    }
    if (mode === 'cat_mooc') {
      return (
        <span
          title={`Cắt mooc (cùng xe, đổi mooc) với ${peerIds.join(', ')}`}
          className={`inline-flex items-center justify-center w-5 h-5 rounded shrink-0 ${MODE_ROW_STYLES.cat_mooc.iconBg}`}
        >
          <Scissors className="w-3 h-3" />
        </span>
      );
    }
    if (hasWarning) {
      return (
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
      );
    }
    return null;
  };

  if (orderedTrips.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 py-14 px-6 text-center">
        <p className="text-sm font-semibold text-slate-800">
          Không tìm thấy chuyến xe phù hợp
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc để xem các chuyến điều xe.
        </p>
      </div>
    );
  }

  // Card view ("Thẻ")
  if (viewMode === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {orderedTrips.map((trip, idx) => {
          const meta = getRowGroupMeta(trip, idx, orderedTrips);
          return (
            <div
              key={trip.id}
              className={`rounded-xl border p-4 transition-colors ${
                meta.style
                  ? `${meta.style.rowBg} ${meta.style.cardBorder}`
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(trip.id)}
                    onChange={() => onToggleSelect(trip.id)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  {renderModeIcon(
                    meta.mode,
                    meta.peerIds,
                    meta.partner,
                    trip.hasWarning
                  )}
                  <span className="font-mono text-sm font-bold text-slate-900">
                    {trip.id}
                  </span>
                  <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-white/80 border border-slate-200 text-slate-700">
                    {trip.containerType}
                  </span>
                </div>
                {meta.style && (
                  <span className="text-[11px] font-semibold text-slate-700">
                    {meta.style.label}
                  </span>
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-y-2 gap-x-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Chủ hàng
                  </span>
                  <span className="font-semibold text-slate-900">
                    {trip.customer}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Số container
                  </span>
                  <span className="font-mono font-medium text-slate-800">
                    {trip.containerNumber || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Số xe · Số mooc
                  </span>
                  <span className="font-mono font-semibold text-slate-900">
                    {trip.plateNumber || 'Chưa điều'}
                  </span>
                  {trip.trailerNumber && (
                    <span className="font-mono text-slate-600">
                      {' '}
                      · {trip.trailerNumber}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Bill / Booking
                  </span>
                  <span className="font-mono font-medium text-slate-800">
                    {trip.billBooking || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Lái xe
                  </span>
                  <span className="text-slate-800">
                    {trip.driverName || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Tuyến đường
                  </span>
                  <span className="text-slate-800">{trip.route}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    CDS cutoff
                  </span>
                  <span className="font-mono tabular-nums text-slate-700">
                    {trip.cdsCutoff || '—'}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500">
                  Ops: {trip.ops}
                </span>
                <div className="flex items-center gap-1">
                  {meta.mode === 'merge' && trip.mergeGroupId && (
                    <button
                      type="button"
                      onClick={() => onUnmergePair(trip.mergeGroupId!)}
                      title="Tách chuyến ghép"
                      className="p-1.5 rounded text-amber-800 hover:bg-amber-200/60 transition-colors cursor-pointer"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onEditTrip(trip)}
                    title="Chỉnh sửa"
                    className="p-1.5 rounded text-slate-500 hover:text-blue-600 hover:bg-white/80 transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onViewTrip(trip)}
                    title="Xem chi tiết"
                    className="p-1.5 rounded text-slate-500 hover:text-slate-900 hover:bg-white/80 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Group by customer if "Gom nhóm" is enabled
  const groupedSections: { groupLabel: string | null; rows: Trip[] }[] =
    groupByCustomer
      ? Object.entries(
          orderedTrips.reduce<Record<string, Trip[]>>((acc, trip) => {
            const key = trip.customer || 'Khác';
            if (!acc[key]) acc[key] = [];
            acc[key].push(trip);
            return acc;
          }, {})
        ).map(([groupLabel, rows]) => ({ groupLabel, rows }))
      : [{ groupLabel: null, rows: orderedTrips }];

  const renderSortIcon = (field: SortField) => {
    const active = sortField === field;
    return (
      <ArrowUpDown
        className={`w-3 h-3 shrink-0 transition-colors ${
          active ? 'text-blue-600' : 'text-slate-400'
        }`}
      />
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-slate-200 text-slate-700 font-semibold text-xs">
              <th className="w-11 px-2 py-2.5 text-center border-r border-slate-200/80">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  aria-label="Chọn tất cả chuyến"
                  className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer align-middle"
                />
              </th>
              <th className="px-3 py-2.5 border-r border-slate-200/80 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => onSort('id')}
                  className="inline-flex items-center gap-1.5 hover:text-slate-900 cursor-pointer"
                >
                  <span>Mã</span>
                  {renderSortIcon('id')}
                </button>
              </th>
              {visibleColumns.vehicleOwner && (
                <th className="px-3 py-2.5 border-r border-slate-200/80 whitespace-nowrap">
                  Chủ xe
                </th>
              )}
              {visibleColumns.plateNumber && (
                <th className="px-3 py-2.5 border-r border-slate-200/80 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onSort('plateNumber')}
                    className="inline-flex items-center gap-1.5 hover:text-slate-900 cursor-pointer"
                  >
                    <span>Số xe</span>
                    {renderSortIcon('plateNumber')}
                  </button>
                </th>
              )}
              {visibleColumns.trailerNumber && (
                <th className="px-3 py-2.5 border-r border-slate-200/80 whitespace-nowrap">
                  Số mooc
                </th>
              )}
              <th className="px-3 py-2.5 border-r border-slate-200/80 whitespace-nowrap">
                Lái xe
              </th>
              {visibleColumns.driverPhone && (
                <th className="px-3 py-2.5 border-r border-slate-200/80 whitespace-nowrap">
                  SĐT lái xe
                </th>
              )}
              {visibleColumns.billBooking && (
                <th className="px-3 py-2.5 border-r border-slate-200/80 whitespace-nowrap">
                  Bill / Booking
                </th>
              )}
              <th className="px-3 py-2.5 border-r border-slate-200/80 whitespace-nowrap min-w-[160px]">
                Ghi chú lô hàng
              </th>
              <th className="px-3 py-2.5 border-r border-slate-200/80 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => onSort('containerType')}
                  className="inline-flex items-center gap-1.5 hover:text-slate-900 cursor-pointer"
                >
                  <span>Loại container</span>
                  {renderSortIcon('containerType')}
                </button>
              </th>
              <th className="px-3 py-2.5 border-r border-slate-200/80 whitespace-nowrap">
                Số container
              </th>
              <th className="px-3 py-2.5 border-r border-slate-200/80 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => onSort('customer')}
                  className="inline-flex items-center gap-1.5 hover:text-slate-900 cursor-pointer"
                >
                  <span>
                    Chủ hàng <span className="text-rose-500">*</span>
                  </span>
                  {renderSortIcon('customer')}
                </button>
              </th>
              {visibleColumns.ops && (
                <th className="px-3 py-2.5 border-r border-slate-200/80 whitespace-nowrap">
                  Ops
                </th>
              )}
              <th className="px-3 py-2.5 border-r border-slate-200/80 whitespace-nowrap">
                Tuyến đường
              </th>
              <th className="px-3 py-2.5 border-r border-slate-200/80 whitespace-nowrap text-right">
                <button
                  type="button"
                  onClick={() => onSort('weight')}
                  className="inline-flex items-center justify-end gap-1.5 hover:text-slate-900 cursor-pointer"
                >
                  <span>Trọng lượng</span>
                  {renderSortIcon('weight')}
                </button>
              </th>
              <th className="px-3 py-2.5 border-r border-slate-200/80 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => onSort('cdsCutoff')}
                  className="inline-flex items-center gap-1.5 hover:text-slate-900 cursor-pointer"
                >
                  <span>CDS cutoff</span>
                  {renderSortIcon('cdsCutoff')}
                </button>
              </th>
              <th className="px-3 py-2.5 text-center whitespace-nowrap">
                Thao tác
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {groupedSections.map((section) => (
              <React.Fragment key={section.groupLabel ?? 'all'}>
                {section.groupLabel && (
                  <tr className="bg-slate-100/80">
                    <td
                      colSpan={17}
                      className="px-3 py-1.5 text-xs font-bold text-slate-700"
                    >
                      Chủ hàng: {section.groupLabel} ({section.rows.length} chuyến)
                    </td>
                  </tr>
                )}
                {section.rows.map((trip, idx) => {
                  const meta = getRowGroupMeta(trip, idx, section.rows);
                  const isSelected = selectedIds.includes(trip.id);

                  const rowClass = meta.style
                    ? meta.style.rowBg
                    : isSelected
                    ? 'bg-blue-50/50 hover:bg-blue-50/70'
                    : 'bg-white hover:bg-slate-50/80';

                  return (
                    <tr
                      key={trip.id}
                      className={`transition-colors ${rowClass}`}
                    >
                      {/* Checkbox + Left Bracket Connector for Ghép / Quay vòng / Cắt mooc */}
                      <td className="relative w-11 px-2 py-2.5 text-center border-r border-slate-200/70 select-none">
                        {meta.style && meta.isFirst && (
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none absolute left-1.5 top-1/2 bottom-0 w-2 border-l-[1.75px] border-t-[1.75px] rounded-tl-[2px] ${meta.style.bracketColor}`}
                          />
                        )}
                        {meta.style && meta.isMiddle && (
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none absolute left-1.5 top-0 bottom-0 w-2 border-l-[1.75px] ${meta.style.bracketColor}`}
                          />
                        )}
                        {meta.style && meta.isLast && (
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none absolute left-1.5 top-0 bottom-1/2 w-2 border-l-[1.75px] border-b-[1.75px] rounded-bl-[2px] ${meta.style.bracketColor}`}
                          />
                        )}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelect(trip.id)}
                          aria-label={`Chọn chuyến ${trip.id}`}
                          className="relative z-10 w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer align-middle"
                        />
                      </td>

                      {/* Mã chuyến + Icon nhận diện Ghép / Quay vòng / Cắt mooc ở đầu */}
                      <td className="px-3 py-2.5 border-r border-slate-200/70 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {renderModeIcon(
                            meta.mode,
                            meta.peerIds,
                            meta.partner,
                            trip.hasWarning
                          )}
                          <button
                            type="button"
                            onClick={() => onViewTrip(trip)}
                            className="font-mono text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
                          >
                            {trip.id}
                          </button>
                        </div>
                      </td>

                      {/* Chủ xe */}
                      {visibleColumns.vehicleOwner && (
                        <td className="px-3 py-2.5 border-r border-slate-200/70 whitespace-nowrap text-xs text-slate-700">
                          {trip.vehicleOwner || (
                            <span className="text-slate-400 italic">
                              Chưa phân xe
                            </span>
                          )}
                        </td>
                      )}

                      {/* Số xe (gán trực tiếp) */}
                      {visibleColumns.plateNumber && (
                        <td className="px-3 py-2 border-r border-slate-200/70 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) =>
                              openCellPopover('vehicle', trip.id, e.currentTarget)
                            }
                            title="Bấm để chọn / đổi số xe"
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                              trip.plateNumber
                                ? 'bg-white/95 border border-slate-200/90 hover:border-blue-400 shadow-[0_1px_1px_rgba(0,0,0,0.03)]'
                                : 'border border-dashed border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600 bg-slate-50/70'
                            }`}
                          >
                            {trip.plateNumber ? (
                              <>
                                <span className="font-mono font-semibold text-slate-800 tabular-nums">
                                  {trip.plateNumber}
                                </span>
                                <MapPin className="w-3 h-3 text-blue-600 fill-blue-100 shrink-0" />
                              </>
                            ) : (
                              <span>+ Chọn xe</span>
                            )}
                            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                          </button>
                        </td>
                      )}

                      {/* Số mooc (gán trực tiếp) */}
                      {visibleColumns.trailerNumber && (
                        <td className="px-3 py-2 border-r border-slate-200/70 whitespace-nowrap">
                          <button
                            ref={(el) => {
                              trailerBtnRefs.current[trip.id] = el;
                            }}
                            type="button"
                            onClick={(e) =>
                              openCellPopover('trailer', trip.id, e.currentTarget)
                            }
                            title="Bấm để chọn / đổi số mooc"
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                              trip.trailerNumber
                                ? 'bg-white/90 border border-slate-200/90 hover:border-blue-400 font-mono font-medium text-slate-800'
                                : trip.plateNumber
                                ? 'border border-dashed border-blue-400 text-blue-700 bg-blue-50/70 hover:bg-blue-100/70 font-medium'
                                : 'border border-dashed border-slate-300 text-slate-400 hover:border-blue-400 hover:text-blue-600'
                            }`}
                          >
                            <span>
                              {trip.trailerNumber ? trip.trailerNumber : '+ Chọn mooc'}
                            </span>
                            <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
                          </button>
                        </td>
                      )}

                      {/* Lái xe */}
                      <td className="px-3 py-2.5 border-r border-slate-200/70 whitespace-nowrap text-xs font-medium text-slate-800">
                        {trip.driverName || (
                          <span className="text-slate-400 font-normal">—</span>
                        )}
                      </td>

                      {/* SĐT lái xe */}
                      {visibleColumns.driverPhone && (
                        <td className="px-3 py-2.5 border-r border-slate-200/70 whitespace-nowrap font-mono text-xs tabular-nums text-slate-600">
                          {trip.driverPhone || '—'}
                        </td>
                      )}

                      {/* Bill / Booking */}
                      {visibleColumns.billBooking && (
                        <td className="px-3 py-2.5 border-r border-slate-200/70 whitespace-nowrap font-mono text-xs text-slate-800">
                          {trip.billBooking || (
                            <span className="text-slate-400 font-sans">—</span>
                          )}
                        </td>
                      )}

                      {/* Ghi chú lô hàng (gọn sạch, không lặp badge thừa) */}
                      <td
                        className={`px-3 py-2 border-r border-slate-200/70 text-xs ${
                          trip.noteHighlight && !meta.style
                            ? 'bg-[#95DE64]/85 text-slate-900 font-medium'
                            : ''
                        }`}
                      >
                        {trip.note ? (
                          <span
                            className={
                              trip.noteHighlight && meta.style
                                ? 'bg-[#95DE64]/90 px-1.5 py-0.5 rounded text-slate-900 font-medium inline-block'
                                : 'text-slate-700'
                            }
                          >
                            {trip.note}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Loại container */}
                      <td className="px-3 py-2.5 border-r border-slate-200/70 whitespace-nowrap font-mono text-xs font-medium text-slate-800">
                        {trip.containerType}
                      </td>

                      {/* Số container */}
                      <td className="px-3 py-2.5 border-r border-slate-200/70 whitespace-nowrap">
                        {trip.containerNumber ? (
                          <span className="inline-block font-mono text-xs font-medium text-slate-800 bg-white/80 px-2 py-0.5 rounded border border-slate-200/80">
                            {trip.containerNumber}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      {/* Chủ hàng */}
                      <td className="px-3 py-2.5 border-r border-slate-200/70 whitespace-nowrap text-xs font-semibold text-slate-900">
                        {trip.customer}
                      </td>

                      {/* Ops */}
                      {visibleColumns.ops && (
                        <td className="px-3 py-2.5 border-r border-slate-200/70 whitespace-nowrap text-xs text-slate-700">
                          {trip.ops}
                        </td>
                      )}

                      {/* Tuyến đường */}
                      <td className="px-3 py-2.5 border-r border-slate-200/70 whitespace-nowrap text-xs text-slate-700">
                        {trip.route}
                      </td>

                      {/* Trọng lượng */}
                      <td className="px-3 py-2.5 border-r border-slate-200/70 whitespace-nowrap text-right font-mono text-xs tabular-nums text-slate-800">
                        {trip.weight !== null ? trip.weight : ''}
                      </td>

                      {/* CDS cutoff */}
                      <td className="px-3 py-2.5 border-r border-slate-200/70 whitespace-nowrap font-mono text-xs tabular-nums text-slate-700">
                        {trip.cdsCutoff || ''}
                      </td>

                      {/* Thao tác */}
                      <td className="px-2.5 py-2 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEditTrip(trip)}
                            title="Chỉnh sửa chuyến"
                            className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-white/80 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {meta.mode === 'merge' && trip.mergeGroupId && (
                            <button
                              type="button"
                              onClick={() => onUnmergePair(trip.mergeGroupId!)}
                              title="Tách chuyến ghép"
                              className="p-1 rounded text-amber-700 hover:text-amber-900 hover:bg-amber-200/70 transition-colors cursor-pointer"
                            >
                              <Unlink className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onViewTrip(trip)}
                            title="Xem chi tiết"
                            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-white/80 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>

          <tfoot>
            <tr className="bg-[#F8FAFC] border-t border-slate-200 text-xs font-bold text-slate-800">
              <td className="px-3 py-2.5" colSpan={2}>
                Tổng ({orderedTrips.length} chuyến)
              </td>
              <td
                colSpan={
                  5 +
                  (visibleColumns.vehicleOwner ? 1 : 0) +
                  (visibleColumns.plateNumber ? 1 : 0) +
                  (visibleColumns.trailerNumber ? 1 : 0) +
                  (visibleColumns.driverPhone ? 1 : 0) +
                  (visibleColumns.billBooking ? 1 : 0) +
                  (visibleColumns.ops ? 1 : 0)
                }
                className="px-3 py-2.5 text-slate-500 font-normal"
              />
              <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-900 border-x border-slate-200/80">
                {totalWeight}
              </td>
              <td colSpan={2} className="px-3 py-2.5" />
            </tr>
          </tfoot>
        </table>
      </div>
      {/* Inline Vehicle / Trailer Assignment Popover */}
      {activePopover &&
        (() => {
          const targetTrip = allTrips.find((t) => t.id === activePopover.tripId);
          if (!targetTrip) return null;

          if (activePopover.type === 'vehicle') {
            return (
              <div
                ref={popoverRef}
                style={{ top: activePopover.top, left: activePopover.left }}
                className="fixed z-50 w-72 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden text-xs"
              >
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Truck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Gán xe cho {targetTrip.id}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActivePopover(null)}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const plate = customInput.trim().toUpperCase();
                    if (!plate) return;
                    const preset = VEHICLE_PRESETS.find(
                      (p) => p.plateNumber.toUpperCase() === plate
                    );
                    const sameTruckTrailers = Array.from(
                      new Set(
                        allTrips
                          .filter(
                            (t) =>
                              t.id !== targetTrip.id &&
                              !t.mergeGroupId &&
                              t.isDispatched &&
                              t.dispatchDate === targetTrip.dispatchDate &&
                              t.plateNumber.trim().toUpperCase() === plate &&
                              t.trailerNumber.trim() !== ''
                          )
                          .map((t) => t.trailerNumber.trim().toUpperCase())
                      )
                    );
                    const currentMooc = targetTrip.trailerNumber.trim().toUpperCase();
                    const willCollideCatMooc =
                      sameTruckTrailers.length > 1 &&
                      Boolean(currentMooc) &&
                      sameTruckTrailers.includes(currentMooc);

                    onAssignVehicle(targetTrip.id, {
                      plateNumber: plate,
                      vehicleOwner: preset?.vehicleOwner ?? (targetTrip.vehicleOwner || 'Xe nhà'),
                      fleetType: preset?.fleetType ?? 'company',
                      driverName: preset?.driverName ?? (targetTrip.driverName || 'Lái xe'),
                      driverPhone: preset?.driverPhone ?? targetTrip.driverPhone,
                    });
                    setActivePopover(null);
                    if (!targetTrip.trailerNumber || willCollideCatMooc) {
                      setPendingTrailerTripId(targetTrip.id);
                    }
                  }}
                  className="p-2 border-b border-slate-100 flex gap-1.5"
                >
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Nhập biển số (VD: 15C-88990)"
                    className="flex-1 px-2.5 py-1.5 text-xs font-mono uppercase border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 cursor-pointer"
                  >
                    Chọn
                  </button>
                </form>

                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                  {VEHICLE_PRESETS.map((preset) => {
                    const sameTruckTrips = allTrips.filter(
                      (t) =>
                        t.id !== targetTrip.id &&
                        !t.mergeGroupId &&
                        t.isDispatched &&
                        t.dispatchDate === targetTrip.dispatchDate &&
                        t.plateNumber.toUpperCase() === preset.plateNumber.toUpperCase()
                    );
                    const existingTrailers = Array.from(
                      new Set(
                        sameTruckTrips
                          .map((t) => t.trailerNumber.trim().toUpperCase())
                          .filter(Boolean)
                      )
                    );
                    const isCatMoocTruck = existingTrailers.length > 1;
                    const isCurrent =
                      targetTrip.plateNumber.toUpperCase() ===
                      preset.plateNumber.toUpperCase();

                    return (
                      <button
                        key={preset.plateNumber}
                        type="button"
                        onClick={() => {
                          const currentMooc = targetTrip.trailerNumber
                            .trim()
                            .toUpperCase();
                          const willCollideCatMooc =
                            isCatMoocTruck &&
                            Boolean(currentMooc) &&
                            existingTrailers.includes(currentMooc);

                          onAssignVehicle(targetTrip.id, {
                            plateNumber: preset.plateNumber,
                            vehicleOwner: preset.vehicleOwner,
                            fleetType: preset.fleetType,
                            driverName: preset.driverName,
                            driverPhone: preset.driverPhone,
                          });
                          setActivePopover(null);
                          if (!targetTrip.trailerNumber || willCollideCatMooc) {
                            setPendingTrailerTripId(targetTrip.id);
                          }
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-blue-50/60 transition-colors cursor-pointer ${
                          isCurrent ? 'bg-blue-50/80' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-slate-900">
                            {preset.plateNumber}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {preset.vehicleOwner}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5 text-[11px] text-slate-600">
                          <span>{preset.driverName}</span>
                          {sameTruckTrips.length > 0 && (
                            <span
                              className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                                isCatMoocTruck
                                  ? 'text-cyan-800 bg-cyan-50 border border-cyan-200'
                                  : 'text-blue-700 bg-blue-50'
                              }`}
                            >
                              {isCatMoocTruck
                                ? `Đang cắt mooc (${existingTrailers.join(', ')})`
                                : `Đã gán ${sameTruckTrips.length} chuyến${
                                    existingTrailers.length > 0
                                      ? ` (${existingTrailers.join(', ')})`
                                      : ''
                                  }`}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {targetTrip.plateNumber && !targetTrip.mergeGroupId && (
                  <div className="p-2 border-t border-slate-100 bg-slate-50">
                    <button
                      type="button"
                      onClick={() => {
                        onAssignVehicle(targetTrip.id, {
                          plateNumber: '',
                          vehicleOwner: '',
                          fleetType: 'company',
                          driverName: '',
                          driverPhone: '',
                        });
                        setActivePopover(null);
                      }}
                      className="w-full py-1.5 text-center text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer"
                    >
                      Bỏ gán xe &amp; mooc
                    </button>
                  </div>
                )}
              </div>
            );
          }

          // Trailer ("Số mooc") popover with live Quay vòng / Cắt mooc preview
          const targetPlate = targetTrip.plateNumber.trim().toUpperCase();
          const samePlatePeers = targetPlate
            ? allTrips.filter(
                (t) =>
                  t.id !== targetTrip.id &&
                  !t.mergeGroupId &&
                  t.isDispatched &&
                  t.dispatchDate === targetTrip.dispatchDate &&
                  t.plateNumber.trim().toUpperCase() === targetPlate &&
                  t.trailerNumber.trim() !== ''
              )
            : [];
          const peerTrailers = Array.from(
            new Set(samePlatePeers.map((t) => t.trailerNumber.trim().toUpperCase()))
          );
          const isTruckInCatMooc = peerTrailers.length > 1;

          const getTrailerOutcome = (candidateMooc: string) => {
            if (!targetPlate || targetTrip.mergeGroupId || peerTrailers.length === 0) {
              return null;
            }
            if (isTruckInCatMooc && peerTrailers.includes(candidateMooc)) {
              return 'duplicate_cat_mooc' as const;
            }
            const combined = Array.from(new Set([...peerTrailers, candidateMooc]));
            return combined.length > 1 ? 'cat_mooc' : 'quay_vong';
          };

          const normalizedCustom = customInput.trim().toUpperCase();
          const isCustomDisabled =
            Boolean(normalizedCustom) &&
            isTruckInCatMooc &&
            peerTrailers.includes(normalizedCustom);

          const handleSelectTrailer = (mooc: string) => {
            const clean = mooc.trim().toUpperCase();
            if (!clean) return;
            if (isTruckInCatMooc && peerTrailers.includes(clean)) return;
            const ok = onAssignTrailer(targetTrip.id, clean);
            if (ok) {
              setActivePopover(null);
            }
          };

          return (
            <div
              ref={popoverRef}
              style={{ top: activePopover.top, left: activePopover.left }}
              className="fixed z-50 w-80 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden text-xs"
            >
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="font-bold text-slate-800">
                  Chọn số mooc · {targetTrip.id}
                </div>
                <button
                  type="button"
                  onClick={() => setActivePopover(null)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {targetPlate && peerTrailers.length > 0 && !targetTrip.mergeGroupId && (
                <div
                  className={`px-3 py-1.5 border-b text-[11px] ${
                    isTruckInCatMooc
                      ? 'bg-cyan-50/80 border-cyan-100 text-cyan-900'
                      : 'bg-slate-50/70 border-slate-100 text-slate-600'
                  }`}
                >
                  {isTruckInCatMooc ? (
                    <>
                      Xe <strong className="font-mono">{targetPlate}</strong> đang
                      trong chuyến <strong>cắt mooc</strong> (
                      <strong className="font-mono">{peerTrailers.join(', ')}</strong>
                      )
                    </>
                  ) : (
                    <>
                      Xe <strong className="font-mono">{targetPlate}</strong> đang
                      kéo mooc{' '}
                      <strong className="font-mono">{peerTrailers.join(', ')}</strong>
                    </>
                  )}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSelectTrailer(customInput);
                }}
                className="p-2 border-b border-slate-100 flex gap-1.5"
              >
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="Nhập số mooc (VD: 15R-09911)"
                  className="flex-1 px-2.5 py-1.5 text-xs font-mono uppercase border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={!normalizedCustom || isCustomDisabled}
                  className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
                >
                  Chọn
                </button>
              </form>

              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                {allKnownTrailers.map((mooc) => {
                  const outcome = getTrailerOutcome(mooc);
                  const isDisabled = outcome === 'duplicate_cat_mooc';
                  const isCurrent =
                    targetTrip.trailerNumber.toUpperCase() === mooc;

                  return (
                    <button
                      key={mooc}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handleSelectTrailer(mooc)}
                      className={`w-full text-left px-3 py-2 transition-colors flex items-center justify-between gap-2 ${
                        isDisabled
                          ? 'bg-slate-50/90 text-slate-400 cursor-not-allowed opacity-70'
                          : isCurrent
                          ? 'bg-blue-50/80 hover:bg-blue-50 cursor-pointer'
                          : 'hover:bg-blue-50/60 cursor-pointer'
                      }`}
                    >
                      <span
                        className={`font-mono font-semibold ${
                          isDisabled
                            ? 'text-slate-400 line-through'
                            : 'text-slate-800'
                        }`}
                      >
                        {mooc}
                      </span>

                      {isDisabled && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                          Đã có chuyến cắt mooc
                        </span>
                      )}
                      {outcome === 'quay_vong' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Repeat className="w-2.5 h-2.5" />
                          Quay vòng
                        </span>
                      )}
                      {outcome === 'cat_mooc' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200">
                          <Scissors className="w-2.5 h-2.5" />
                          Cắt mooc
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {targetTrip.trailerNumber && (
                <div className="p-2 border-t border-slate-100 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => {
                      onAssignTrailer(targetTrip.id, '');
                      setActivePopover(null);
                    }}
                    className="w-full py-1.5 text-center text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer"
                  >
                    Bỏ chọn mooc
                  </button>
                </div>
              )}
            </div>
          );
        })()}
    </div>
  );
};
