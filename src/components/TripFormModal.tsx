import React, { useEffect, useMemo, useState } from 'react';
import { X, Link2, Unlink, Truck, Container, Repeat, Scissors, AlertTriangle } from 'lucide-react';
import { ContainerType, DispatchMode, FleetType, Trip } from '../types/dispatch';
import { VEHICLE_PRESETS } from '../data/initialTrips';

interface TripFormModalProps {
  isOpen: boolean;
  initialTrip: Trip | null;
  allTrips: Trip[];
  onClose: () => void;
  onSave: (trip: Trip) => void;
}

export const TripFormModal: React.FC<TripFormModalProps> = ({
  isOpen,
  initialTrip,
  allTrips,
  onClose,
  onSave,
}) => {
  const [id, setId] = useState('');
  const [customer, setCustomer] = useState('');
  const [containerType, setContainerType] = useState<ContainerType>("20' DC");
  const [containerNumber, setContainerNumber] = useState('');
  const [billBooking, setBillBooking] = useState('');
  const [route, setRoute] = useState('');
  const [ops, setOps] = useState('Phạm Văn Chiến');
  const [weight, setWeight] = useState('');
  const [cdsCutoff, setCdsCutoff] = useState('26/11/2026 16:00');
  const [note, setNote] = useState('');
  const [vehicleOwner, setVehicleOwner] = useState('Xe nhà');
  const [fleetType, setFleetType] = useState<FleetType>('company');
  const [plateNumber, setPlateNumber] = useState('');
  const [trailerNumber, setTrailerNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (initialTrip) {
      setId(initialTrip.id);
      setCustomer(initialTrip.customer);
      setContainerType(initialTrip.containerType);
      setContainerNumber(initialTrip.containerNumber);
      setBillBooking(initialTrip.billBooking || '');
      setRoute(initialTrip.route);
      setOps(initialTrip.ops);
      setWeight(initialTrip.weight !== null ? String(initialTrip.weight) : '');
      setCdsCutoff(initialTrip.cdsCutoff);
      setNote(initialTrip.note);
      setVehicleOwner(initialTrip.vehicleOwner);
      setFleetType(initialTrip.fleetType);
      setPlateNumber(initialTrip.plateNumber);
      setTrailerNumber(initialTrip.trailerNumber || '');
      setDriverName(initialTrip.driverName);
      setDriverPhone(initialTrip.driverPhone);
    } else {
      const randomNum = Math.floor(720 + Math.random() * 200);
      setId(`CX000${randomNum}`);
      setCustomer('');
      setContainerType("20' DC");
      setContainerNumber('');
      setBillBooking('');
      setRoute('');
      setOps('Phạm Văn Chiến');
      setWeight('');
      setCdsCutoff('26/11/2026 16:00');
      setNote('');
      setVehicleOwner('');
      setFleetType('company');
      setPlateNumber('');
      setTrailerNumber('');
      setDriverName('');
      setDriverPhone('');
    }
  }, [isOpen, initialTrip]);

  // Live detection of Quay vòng vs Cắt mooc based on same-day plateNumber + trailerNumber
  const assignmentHint = useMemo(() => {
    const plate = plateNumber.trim().toUpperCase();
    const trailer = trailerNumber.trim().toUpperCase();
    const date = initialTrip?.dispatchDate || '25/11/2026';
    if (!plate || initialTrip?.mergeGroupId) return null;

    const samePlateOthers = allTrips.filter(
      (t) =>
        t.id !== id &&
        !t.mergeGroupId &&
        t.isDispatched &&
        t.dispatchDate === date &&
        t.plateNumber.trim().toUpperCase() === plate
    );
    if (samePlateOthers.length === 0) return null;

    const otherTrailers = samePlateOthers
      .map((t) => t.trailerNumber.trim().toUpperCase())
      .filter(Boolean);
    const uniqueOtherTrailers = Array.from(new Set(otherTrailers));
    const allTrailers = Array.from(
      new Set([...uniqueOtherTrailers, ...(trailer ? [trailer] : [])])
    );

    if (
      uniqueOtherTrailers.length > 1 &&
      trailer &&
      uniqueOtherTrailers.includes(trailer)
    ) {
      return {
        type: 'duplicate_cat_mooc' as const,
        label: `Đã có chuyến xe cắt mooc: Xe ${plate} đang chạy cụm cắt mooc (${uniqueOtherTrailers.join(', ')}) với mooc ${trailer}. Vui lòng chọn mooc khác.`,
      };
    }

    if (allTrailers.length > 1) {
      return {
        type: 'cat_mooc' as const,
        label: `Cắt mooc: Xe ${plate} đang chạy ${samePlateOthers.length} chuyến khác trong ngày với mooc khác (${uniqueOtherTrailers.join(', ')}).`,
      };
    }

    return {
      type: 'quay_vong' as const,
      label: `Quay vòng: Xe ${plate}${trailer ? ` + mooc ${trailer}` : ''} đã gán ${samePlateOthers.length} chuyến khác cùng mooc trong ngày.`,
    };
  }, [allTrips, id, initialTrip, plateNumber, trailerNumber]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.trim() || !route.trim()) return;
    if (assignmentHint?.type === 'duplicate_cat_mooc') return;

    const isDispatched = Boolean(plateNumber.trim() && driverName.trim());
    const resolvedOwner = vehicleOwner.trim() || (isDispatched ? 'Xe nhà' : '');

    onSave({
      id: id.trim() || `CX000${Math.floor(720 + Math.random() * 200)}`,
      jobCode: initialTrip?.jobCode || `JOB2611${Math.floor(180 + Math.random() * 800)}`,
      vehicleOwner: resolvedOwner,
      fleetType:
        resolvedOwner.toLowerCase().includes('nhà') || !resolvedOwner
          ? fleetType === 'hired' && resolvedOwner
            ? 'hired'
            : 'company'
          : 'hired',
      plateNumber: plateNumber.trim().toUpperCase(),
      trailerNumber: trailerNumber.trim().toUpperCase(),
      driverName: driverName.trim(),
      driverPhone: driverPhone.trim(),
      note: note.trim(),
      noteHighlight: initialTrip?.noteHighlight,
      containerType,
      containerNumber: containerNumber.trim().toUpperCase(),
      billBooking: billBooking.trim().toUpperCase(),
      customer: customer.trim().toUpperCase(),
      ops: ops.trim() || 'Phạm Văn Chiến',
      route: route.trim(),
      pickupPoint: initialTrip?.pickupPoint || 'CẢNG NAM ĐÌNH VŨ',
      weight: weight.trim() ? Number(weight) : null,
      cdsCutoff: cdsCutoff.trim(),
      dispatchDate: initialTrip?.dispatchDate || '25/11/2026',
      isDispatched,
      hasWarning: !containerNumber.trim(),
      mergeGroupId: initialTrip?.mergeGroupId ?? null,
      mergePartnerId: initialTrip?.mergePartnerId ?? null,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Container className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              {initialTrip ? `Chỉnh sửa chuyến ${initialTrip.id}` : 'Thêm mới chuyến điều xe'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mã chuyến
              </label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                disabled={Boolean(initialTrip)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg disabled:opacity-70"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Loại container <span className="text-rose-500">*</span>
              </label>
              <select
                value={containerType}
                onChange={(e) => setContainerType(e.target.value as ContainerType)}
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg"
              >
                <option value="20' DC">20&apos; DC</option>
                <option value="20' RF">20&apos; RF</option>
                <option value="20' OT">20&apos; OT</option>
                <option value="40' HC">40&apos; HC</option>
                <option value="40' DC">40&apos; DC</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số container
              </label>
              <input
                type="text"
                value={containerNumber}
                onChange={(e) => setContainerNumber(e.target.value)}
                placeholder="VD: GMDU2141356"
                className="w-full px-3 py-2 text-xs font-mono uppercase bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chủ hàng <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="VD: NAM ĐỒNG, CTY MAXWELL"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bill / Booking
              </label>
              <input
                type="text"
                value={billBooking}
                onChange={(e) => setBillBooking(e.target.value)}
                placeholder="VD: HANGK7604901"
                className="w-full px-3 py-2 text-xs font-mono uppercase bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tuyến đường <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                placeholder="VD: Quỳnh Côi, Hưng Yên"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ops phụ trách
              </label>
              <input
                type="text"
                value={ops}
                onChange={(e) => setOps(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Trọng lượng (tấn)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="VD: 18"
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CDS cutoff
              </label>
              <input
                type="text"
                value={cdsCutoff}
                onChange={(e) => setCdsCutoff(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ghi chú lô hàng
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú giao nhận hoặc yêu cầu đặc biệt..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 space-y-3">
            <div className="flex items-center gap-2">
              <Truck className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-xs font-bold text-slate-800">
                Thông tin điều xe &amp; mooc (tự động nhận diện Quay vòng / Cắt mooc)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Chủ xe
                </label>
                <input
                  type="text"
                  value={vehicleOwner}
                  onChange={(e) => setVehicleOwner(e.target.value)}
                  placeholder="Xe nhà / Xe thuê"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Số xe
                </label>
                <input
                  type="text"
                  list="form-plate-list"
                  value={plateNumber}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPlateNumber(val);
                    const match = VEHICLE_PRESETS.find(
                      (p) => p.plateNumber.toLowerCase() === val.trim().toLowerCase()
                    );
                    if (match) {
                      setVehicleOwner(match.vehicleOwner);
                      setFleetType(match.fleetType);
                      setTrailerNumber(match.trailerNumber);
                      setDriverName(match.driverName);
                      setDriverPhone(match.driverPhone);
                    }
                  }}
                  placeholder="15C-25525"
                  className="w-full px-2.5 py-1.5 text-xs font-mono uppercase bg-white border border-slate-300 rounded-lg"
                />
                <datalist id="form-plate-list">
                  {VEHICLE_PRESETS.map((p) => (
                    <option key={p.plateNumber} value={p.plateNumber} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Số mooc
                </label>
                <input
                  type="text"
                  value={trailerNumber}
                  onChange={(e) => setTrailerNumber(e.target.value)}
                  placeholder="15R-04218"
                  className="w-full px-2.5 py-1.5 text-xs font-mono uppercase bg-white border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Lái xe
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Tên lái xe"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="0912..."
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {assignmentHint && (
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${
                  assignmentHint.type === 'duplicate_cat_mooc'
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : assignmentHint.type === 'quay_vong'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                    : 'bg-cyan-50 border-cyan-200 text-cyan-900'
                }`}
              >
                {assignmentHint.type === 'duplicate_cat_mooc' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                ) : assignmentHint.type === 'quay_vong' ? (
                  <Repeat className="w-4 h-4 shrink-0" />
                ) : (
                  <Scissors className="w-4 h-4 shrink-0" />
                )}
                <span>{assignmentHint.label}</span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={assignmentHint?.type === 'duplicate_cat_mooc'}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg cursor-pointer"
            >
              {initialTrip ? 'Lưu thay đổi' : 'Tạo chuyến mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface TripDetailModalProps {
  trip: Trip | null;
  groupTrips: Trip[];
  mode: DispatchMode;
  onClose: () => void;
  onUnmergePair: (mergeGroupId: string) => void;
}

const GROUP_HEADER_META: Record<
  Exclude<DispatchMode, 'single'>,
  {
    title: string;
    subtitle: string;
    bannerBg: string;
    badgeBg: string;
    icon: React.ReactNode;
  }
> = {
  merge: {
    title: "Chi tiết cụm chuyến Ghép (2 cont 20')",
    subtitle: '2 container 20\' ghép chung trên 1 xe và 1 mooc',
    bannerBg: 'bg-[#FCE49C] border-amber-400 text-amber-950',
    badgeBg: 'bg-amber-300/80 text-amber-950 border-amber-400',
    icon: <Link2 className="w-4 h-4 text-amber-900 shrink-0" />,
  },
  quay_vong: {
    title: 'Chi tiết cụm chuyến Quay vòng',
    subtitle: 'Cùng 1 xe và 1 mooc thực hiện nhiều chuyến trong ngày',
    bannerBg: 'bg-[#D6E0FF] border-indigo-300 text-indigo-950',
    badgeBg: 'bg-indigo-200 text-indigo-900 border-indigo-300',
    icon: <Repeat className="w-4 h-4 text-indigo-700 shrink-0" />,
  },
  cat_mooc: {
    title: 'Chi tiết cụm chuyến Cắt mooc',
    subtitle: 'Cùng 1 xe đầu kéo chạy nhiều chuyến với các mooc khác nhau',
    bannerBg: 'bg-[#BEEAF5] border-cyan-400 text-cyan-950',
    badgeBg: 'bg-cyan-200 text-cyan-950 border-cyan-300',
    icon: <Scissors className="w-4 h-4 text-cyan-800 shrink-0" />,
  },
};

export const TripDetailModal: React.FC<TripDetailModalProps> = ({
  trip,
  groupTrips,
  mode,
  onClose,
  onUnmergePair,
}) => {
  if (!trip) return null;

  const isGroupView = mode !== 'single' && groupTrips.length > 1;
  const displayTrips = isGroupView ? groupTrips : [trip];
  const groupMeta = mode !== 'single' ? GROUP_HEADER_META[mode] : null;
  const totalWeight = displayTrips.reduce((s, t) => s + (t.weight ?? 0), 0);
  const distinctTrailers = Array.from(
    new Set(displayTrips.map((t) => t.trailerNumber).filter(Boolean))
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`bg-white rounded-xl border border-slate-200 shadow-2xl w-full overflow-hidden max-h-[90vh] flex flex-col ${
          isGroupView ? 'max-w-4xl' : 'max-w-lg'
        }`}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {groupMeta ? (
              <>
                {groupMeta.icon}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900">
                      {groupMeta.title}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${groupMeta.badgeBg}`}
                    >
                      {displayTrips.length} chuyến
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {groupMeta.subtitle}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-slate-900">
                  {trip.id}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-xs font-semibold text-slate-600">
                  {trip.customer}
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto">
          {isGroupView && groupMeta && (
            <div
              className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${groupMeta.bannerBg}`}
            >
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                <div>
                  <span className="text-[11px] opacity-70 block">Chủ xe</span>
                  <span className="font-semibold">
                    {trip.vehicleOwner || 'Chưa phân'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] opacity-70 block">Số xe</span>
                  <span className="font-mono font-bold">
                    {trip.plateNumber || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] opacity-70 block">
                    {distinctTrailers.length > 1 ? 'Các số mooc' : 'Số mooc'}
                  </span>
                  <span className="font-mono font-semibold">
                    {distinctTrailers.join(' / ') || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] opacity-70 block">Lái xe &amp; SĐT</span>
                  <span className="font-medium">
                    {trip.driverName || '—'} ·{' '}
                    <span className="font-mono tabular-nums">
                      {trip.driverPhone || '—'}
                    </span>
                  </span>
                </div>
                <div>
                  <span className="text-[11px] opacity-70 block">
                    Tổng trọng lượng
                  </span>
                  <span className="font-mono font-bold tabular-nums">
                    {totalWeight} tấn
                  </span>
                </div>
              </div>

              {mode === 'merge' && trip.mergeGroupId && (
                <button
                  type="button"
                  onClick={() => {
                    onUnmergePair(trip.mergeGroupId!);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white border border-amber-300 text-amber-900 font-semibold hover:bg-amber-50 cursor-pointer shrink-0"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  Tách ghép
                </button>
              )}
            </div>
          )}

          {/* Trips Cards */}
          <div
            className={`grid gap-3.5 ${
              isGroupView ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {displayTrips.map((item, idx) => {
              const isClickedTrip = isGroupView && item.id === trip.id;
              return (
                <div
                  key={item.id}
                  className={`rounded-xl border p-4 space-y-3 ${
                    isClickedTrip
                      ? 'border-blue-400 bg-blue-50/25 ring-1 ring-blue-400/20'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  {isGroupView && (
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-400">
                          Chuyến {idx + 1}
                        </span>
                        <span className="font-mono text-sm font-bold text-blue-700">
                          {item.id}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="font-bold text-slate-900">
                          {item.customer}
                        </span>
                      </div>
                      {isClickedTrip && (
                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded">
                          Đang chọn
                        </span>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 block">
                        Loại &amp; Số container
                      </span>
                      <span className="font-mono font-semibold text-slate-900">
                        {item.containerType} ·{' '}
                        {item.containerNumber || 'Chưa cấp số'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Bill / Booking</span>
                      <span className="font-mono font-medium text-slate-900">
                        {item.billBooking || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Tuyến đường</span>
                      <span className="font-medium text-slate-900">
                        {item.route}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">
                        Chủ xe / Số xe
                      </span>
                      <span className="font-medium text-slate-900">
                        {item.vehicleOwner || 'Chưa phân'} ·{' '}
                        <span className="font-mono">
                          {item.plateNumber || '—'}
                        </span>
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Số mooc</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {item.trailerNumber || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Lái xe / SĐT</span>
                      <span className="font-medium text-slate-900">
                        {item.driverName || '—'} ·{' '}
                        <span className="font-mono tabular-nums">
                          {item.driverPhone || '—'}
                        </span>
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">
                        Trọng lượng &amp; Cutoff
                      </span>
                      <span className="font-mono tabular-nums text-slate-800">
                        {item.weight !== null ? `${item.weight}T` : '—'} ·{' '}
                        {item.cdsCutoff || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Điểm lấy vỏ</span>
                      <span className="text-slate-800">
                        {item.pickupPoint || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Ops phụ trách</span>
                      <span className="text-slate-800">{item.ops}</span>
                    </div>
                  </div>

                  {item.note && (
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                      <span className="text-slate-400 mr-1.5">Ghi chú:</span>
                      {item.note}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
