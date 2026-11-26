import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  Container,
  Truck,
  Link2,
  AlertCircle,
  MapPin,
} from 'lucide-react';
import { MergeDispatchPayload, Trip } from '../types/dispatch';
import { VEHICLE_PRESETS } from '../data/initialTrips';

interface MergeTripModalProps {
  isOpen: boolean;
  trips: Trip[];
  preselectedIds: string[];
  onClose: () => void;
  onConfirmMerge: (payload: MergeDispatchPayload) => void;
}

export const MergeTripModal: React.FC<MergeTripModalProps> = ({
  isOpen,
  trips,
  preselectedIds,
  onClose,
  onConfirmMerge,
}) => {
  const [container1Id, setContainer1Id] = useState<string>('');
  const [container2Id, setContainer2Id] = useState<string>('');
  const [search1, setSearch1] = useState('');
  const [search2, setSearch2] = useState('');

  const [vehicleOwner, setVehicleOwner] = useState('Xe nhà');
  const [plateNumber, setPlateNumber] = useState('');
  const [trailerNumber, setTrailerNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Only containers with type starting with 20' and not already merged
  const eligible20Trips = useMemo(
    () =>
      trips.filter(
        (t) => t.containerType.startsWith("20'") && !t.mergeGroupId
      ),
    [trips]
  );

  const non20Count = useMemo(
    () => trips.filter((t) => !t.containerType.startsWith("20'")).length,
    [trips]
  );

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setSearch1('');
    setSearch2('');

    const validPreselected = preselectedIds.filter((id) =>
      eligible20Trips.some((t) => t.id === id)
    );

    const firstId = validPreselected[0] ?? '';
    const secondId = validPreselected[1] ?? '';
    setContainer1Id(firstId);
    setContainer2Id(secondId);

    const firstTrip = eligible20Trips.find((t) => t.id === firstId);
    if (firstTrip && firstTrip.plateNumber) {
      setVehicleOwner(firstTrip.vehicleOwner || 'Xe nhà');
      setPlateNumber(firstTrip.plateNumber);
      setTrailerNumber(firstTrip.trailerNumber || '');
      setDriverName(firstTrip.driverName);
      setDriverPhone(firstTrip.driverPhone);
    } else {
      setVehicleOwner('Xe nhà');
      setPlateNumber('');
      setTrailerNumber('');
      setDriverName('');
      setDriverPhone('');
    }
  }, [isOpen, preselectedIds, eligible20Trips]);

  const filterList = (query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return eligible20Trips;
    return eligible20Trips.filter(
      (t) =>
        t.id.toLowerCase().includes(q) ||
        t.containerNumber.toLowerCase().includes(q) ||
        t.billBooking.toLowerCase().includes(q) ||
        t.customer.toLowerCase().includes(q) ||
        t.route.toLowerCase().includes(q) ||
        t.jobCode.toLowerCase().includes(q)
    );
  };

  const list1 = useMemo(() => filterList(search1), [eligible20Trips, search1]);
  const list2 = useMemo(() => filterList(search2), [eligible20Trips, search2]);

  const selected1 = eligible20Trips.find((t) => t.id === container1Id) ?? null;
  const selected2 = eligible20Trips.find((t) => t.id === container2Id) ?? null;

  const handleSelectPlatePreset = (plate: string) => {
    setPlateNumber(plate);
    const preset = VEHICLE_PRESETS.find((v) => v.plateNumber === plate);
    if (preset) {
      setVehicleOwner(preset.vehicleOwner);
      setTrailerNumber(preset.trailerNumber);
      setDriverName(preset.driverName);
      setDriverPhone(preset.driverPhone);
    }
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!container1Id || !container2Id) {
      setErrorMsg('Vui lòng chọn đủ cả Container 1 và Container 2 để ghép chuyến.');
      return;
    }
    if (container1Id === container2Id) {
      setErrorMsg('Container 1 và Container 2 không được trùng nhau.');
      return;
    }
    if (!vehicleOwner.trim() || !plateNumber.trim() || !driverName.trim() || !driverPhone.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ Chủ xe, Số xe, Tên lái xe và Số điện thoại.');
      return;
    }
    onConfirmMerge({
      container1Id,
      container2Id,
      vehicleOwner: vehicleOwner.trim(),
      plateNumber: plateNumber.trim().toUpperCase(),
      trailerNumber: trailerNumber.trim().toUpperCase(),
      driverName: driverName.trim(),
      driverPhone: driverPhone.trim(),
    });
  };

  if (!isOpen) return null;

  const combinedWeight =
    (selected1?.weight ?? 0) + (selected2?.weight ?? 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-[1px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="merge-modal-title"
    >
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
              <Link2 className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h2
                id="merge-modal-title"
                className="text-base font-bold text-slate-900"
              >
                Ghép chuyến container 20&apos;
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Chỉ hiển thị các chuyến có loại container 20&apos; chưa ghép ({eligible20Trips.length} cont khả dụng
                {non20Count > 0 ? ` · đã ẩn ${non20Count} cont 40'` : ''})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Đóng popup ghép chuyến"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Top 2 Panels: Container 1 & Container 2 (matching Screenshot 2) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Container 1 Box */}
            <ContainerPickerBox
              title="Container 1"
              search={search1}
              onSearchChange={setSearch1}
              trips={list1}
              selectedTrip={selected1}
              otherSelectedId={container2Id}
              onSelect={(id) => {
                setContainer1Id(id);
                setErrorMsg(null);
              }}
              onClear={() => setContainer1Id('')}
            />

            {/* Container 2 Box */}
            <ContainerPickerBox
              title="Container 2"
              search={search2}
              onSearchChange={setSearch2}
              trips={list2}
              selectedTrip={selected2}
              otherSelectedId={container1Id}
              onSelect={(id) => {
                setContainer2Id(id);
                setErrorMsg(null);
              }}
              onClear={() => setContainer2Id('')}
            />
          </div>

          {/* Bottom 4 Dispatch Fields (matching Screenshot 2: Chủ xe | Số xe | Tên lái xe | Số điện thoại) */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-slate-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Thông tin điều xe cho chuyến ghép
                </h3>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
                <span>Chọn nhanh xe:</span>
                {VEHICLE_PRESETS.slice(0, 3).map((preset) => (
                  <button
                    key={preset.plateNumber}
                    type="button"
                    onClick={() => handleSelectPlatePreset(preset.plateNumber)}
                    className={`px-2 py-0.5 rounded border font-mono text-[11px] transition-colors cursor-pointer ${
                      plateNumber === preset.plateNumber
                        ? 'bg-blue-50 border-blue-400 text-blue-700 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {preset.plateNumber}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Chủ xe <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  list="vehicle-owner-options"
                  value={vehicleOwner}
                  onChange={(e) => {
                    setVehicleOwner(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="VD: Xe nhà hoặc đơn vị thuê"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <datalist id="vehicle-owner-options">
                  <option value="Xe nhà" />
                  <option value="Vận tải Hải Phòng" />
                  <option value="Vận tải Hoàng Long" />
                  <option value="Vận tải Minh Phát" />
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Số xe <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  list="plate-number-options"
                  value={plateNumber}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPlateNumber(val);
                    const matched = VEHICLE_PRESETS.find(
                      (p) => p.plateNumber.toLowerCase() === val.trim().toLowerCase()
                    );
                    if (matched) {
                      setVehicleOwner(matched.vehicleOwner);
                      setTrailerNumber(matched.trailerNumber);
                      setDriverName(matched.driverName);
                      setDriverPhone(matched.driverPhone);
                    }
                    setErrorMsg(null);
                  }}
                  placeholder="VD: 15C-25525"
                  className="w-full px-3 py-2 text-sm font-mono uppercase bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <datalist id="plate-number-options">
                  {VEHICLE_PRESETS.map((p) => (
                    <option key={p.plateNumber} value={p.plateNumber}>
                      {p.driverName} · {p.vehicleOwner}
                    </option>
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Số mooc
                </label>
                <input
                  type="text"
                  value={trailerNumber}
                  onChange={(e) => {
                    setTrailerNumber(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="VD: 15R-02552"
                  className="w-full px-3 py-2 text-sm font-mono uppercase bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tên lái xe <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => {
                    setDriverName(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="Nhập họ tên lái xe"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Số điện thoại <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={driverPhone}
                  onChange={(e) => {
                    setDriverPhone(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="VD: 0912 458 321"
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Footer Summary & Actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-600">
              {selected1 && selected2 ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-800">
                    Cặp ghép:
                  </span>
                  <span className="font-mono font-semibold text-amber-800 bg-[#FEF3D6] px-2 py-0.5 rounded border border-amber-300">
                    {selected1.id} ({selected1.containerNumber || 'Chưa có số cont'})
                  </span>
                  <span className="text-slate-400">+</span>
                  <span className="font-mono font-semibold text-amber-800 bg-[#FEF3D6] px-2 py-0.5 rounded border border-amber-300">
                    {selected2.id} ({selected2.containerNumber || 'Chưa có số cont'})
                  </span>
                  {combinedWeight > 0 && (
                    <span className="text-slate-500 tabular-nums">
                      · Tổng trọng lượng: <strong>{combinedWeight}</strong> tấn
                    </span>
                  )}
                </div>
              ) : (
                <span>
                  Chọn 1 container ở cột trái và 1 container ở cột phải để ghép cặp.
                </span>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Xác nhận ghép chuyến</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ContainerPickerBoxProps {
  title: string;
  search: string;
  onSearchChange: (val: string) => void;
  trips: Trip[];
  selectedTrip: Trip | null;
  otherSelectedId: string;
  onSelect: (id: string) => void;
  onClear: () => void;
}

const ContainerPickerBox: React.FC<ContainerPickerBoxProps> = ({
  title,
  search,
  onSearchChange,
  trips,
  selectedTrip,
  otherSelectedId,
  onSelect,
  onClear,
}) => {
  return (
    <div className="flex flex-col border border-slate-200 rounded-xl bg-slate-50/50 overflow-hidden">
      {/* Box Header */}
      <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Container className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-bold text-slate-900">{title}</span>
        </div>
        {selectedTrip ? (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-medium text-rose-600 hover:text-rose-700 cursor-pointer"
          >
            Bỏ chọn
          </button>
        ) : (
          <span className="text-[11px] font-medium text-slate-400">
            Chưa chọn cont
          </span>
        )}
      </div>

      {/* Selected Summary Banner */}
      {selectedTrip && (
        <div className="mx-3 mt-3 p-3 rounded-lg bg-[#FEF3D6] border border-amber-300 flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="font-mono text-xs font-bold text-slate-900">
                {selectedTrip.id}
              </span>
              <span className="text-slate-400">·</span>
              <span className="font-mono text-xs font-semibold text-slate-800">
                {selectedTrip.containerNumber || 'Chưa có số cont'}
              </span>
              <span className="text-[11px] font-mono font-medium text-amber-900 bg-amber-200/70 px-1.5 py-0.5 rounded">
                {selectedTrip.containerType}
              </span>
            </div>
            <div className="text-xs text-slate-700 flex flex-wrap items-center gap-x-2 gap-y-0.5 pl-6">
              <span className="font-semibold">{selectedTrip.customer}</span>
              <span className="text-slate-400">·</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-500" />
                {selectedTrip.route}
              </span>
              {selectedTrip.weight !== null && (
                <>
                  <span className="text-slate-400">·</span>
                  <span className="tabular-nums">{selectedTrip.weight} tấn</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search inside container box */}
      <div className="p-3 pb-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm mã chuyến, số cont, chủ hàng, tuyến..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Scrollable List of 20' containers */}
      <div className="px-3 pb-3 space-y-1.5 max-h-60 overflow-y-auto">
        {trips.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Không có container 20&apos; phù hợp.
          </div>
        ) : (
          trips.map((trip) => {
            const isSelected = selectedTrip?.id === trip.id;
            const isPickedInOther = otherSelectedId === trip.id;

            return (
              <button
                key={trip.id}
                type="button"
                disabled={isPickedInOther}
                onClick={() => onSelect(trip.id)}
                className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-start justify-between gap-2 ${
                  isPickedInOther
                    ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'
                    : isSelected
                    ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500/20 cursor-pointer'
                    : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer'
                }`}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {trip.id}
                    </span>
                    <span className="font-mono text-xs font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                      {trip.containerNumber || 'Chưa có số cont'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-600">
                      {trip.containerType}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-x-2">
                    <span className="font-medium text-slate-800">
                      {trip.customer}
                    </span>
                    {trip.billBooking && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span className="font-mono text-slate-600">
                          {trip.billBooking}
                        </span>
                      </>
                    )}
                    <span className="text-slate-300">·</span>
                    <span>{trip.route}</span>
                    {trip.cdsCutoff && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span className="font-mono tabular-nums text-slate-500">
                          Cutoff: {trip.cdsCutoff}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {isPickedInOther ? (
                    <span className="text-[10px] font-medium text-slate-500">
                      Đã chọn bên kia
                    </span>
                  ) : isSelected ? (
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  ) : trip.weight !== null ? (
                    <span className="text-[11px] font-mono tabular-nums text-slate-500">
                      {trip.weight}T
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
