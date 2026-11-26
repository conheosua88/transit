import React from 'react';
import { Link2, Repeat, Scissors, X } from 'lucide-react';
import { DispatchPlanSummaryData } from '../utils/dispatchClassification';
import { KpiFilterType } from '../types/dispatch';

interface DispatchPlanSummaryProps {
  summary: DispatchPlanSummaryData;
  dateLabel: string;
  activeFilter: KpiFilterType;
  onFilterMode: (filter: KpiFilterType) => void;
  onClose: () => void;
}

export const DispatchPlanSummary: React.FC<DispatchPlanSummaryProps> = ({
  summary,
  dateLabel,
  activeFilter,
  onFilterMode,
  onClose,
}) => {
  const maxRows = Math.max(
    summary.mergeRows.length,
    summary.quayVongRows.length,
    summary.catMoocRows.length,
    1
  );
  const rowIndices = Array.from({ length: maxRows }, (_, i) => i);

  return (
    <section
      aria-label="Phương án điều xe thực hiện"
      className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
    >
      {/* Header */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-900">
            Phương án điều xe thực hiện ngày {dateLabel}
          </h2>
          <div className="flex items-center gap-3 text-[11px] text-slate-600 tabular-nums">
            <span>
              Tổng hàng: <strong className="text-slate-900">{summary.totalTripsCount}</strong> chuyến
            </span>
            <span className="text-slate-300">·</span>
            <span>
              Xe nhà: <strong className="text-teal-700">{summary.companyTripsCount}</strong>
            </span>
            <span className="text-slate-300">·</span>
            <span>
              Xe thuê: <strong className="text-amber-700">{summary.hiredTripsCount}</strong>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          title="Thu gọn bảng phương án"
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 3-column summary matrix matching user's reference sheet */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-[#EDF5E8] border-b border-slate-200 text-slate-800 font-bold">
              <th
                colSpan={2}
                className="px-3 py-2 border-r border-slate-200 text-center"
              >
                <button
                  type="button"
                  onClick={() =>
                    onFilterMode(activeFilter === 'merged' ? 'all' : 'merged')
                  }
                  className="inline-flex items-center gap-1.5 hover:text-amber-800 cursor-pointer"
                >
                  <Link2 className="w-3.5 h-3.5 text-amber-700" />
                  <span>Ghép</span>
                </button>
              </th>
              <th
                colSpan={2}
                className="px-3 py-2 border-r border-slate-200 text-center"
              >
                <button
                  type="button"
                  onClick={() =>
                    onFilterMode(
                      activeFilter === 'quay_vong' ? 'all' : 'quay_vong'
                    )
                  }
                  className="inline-flex items-center gap-1.5 hover:text-indigo-700 cursor-pointer"
                >
                  <Repeat className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Quay vòng</span>
                </button>
              </th>
              <th
                colSpan={2}
                className="px-3 py-2 border-r border-slate-200 text-center"
              >
                <button
                  type="button"
                  onClick={() =>
                    onFilterMode(activeFilter === 'cat_mooc' ? 'all' : 'cat_mooc')
                  }
                  className="inline-flex items-center gap-1.5 hover:text-cyan-800 cursor-pointer"
                >
                  <Scissors className="w-3.5 h-3.5 text-cyan-700" />
                  <span>Cắt mooc</span>
                </button>
              </th>
              <th className="px-3 py-2 text-center w-24 text-blue-700">Tổng</th>
            </tr>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
              <th
                title="Số lượng xe tối ưu được (Số chuyến - 1 xe chạy)"
                className="w-12 px-2 py-1.5 border-r border-slate-200 text-center"
              >
                SL
              </th>
              <th className="px-3 py-1.5 border-r border-slate-200 text-left">
                Chủ hàng
              </th>
              <th
                title="Số lượng xe tối ưu được (Số chuyến - 1 xe chạy)"
                className="w-12 px-2 py-1.5 border-r border-slate-200 text-center"
              >
                SL
              </th>
              <th className="px-3 py-1.5 border-r border-slate-200 text-left">
                Chủ hàng
              </th>
              <th
                title="Số lượng xe tối ưu được (Số chuyến - 1 xe chạy)"
                className="w-12 px-2 py-1.5 border-r border-slate-200 text-center"
              >
                SL
              </th>
              <th className="px-3 py-1.5 border-r border-slate-200 text-left">
                Chủ hàng
              </th>
              <th className="px-3 py-1.5 text-center text-slate-500 font-medium">
                Xe tối ưu
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200/80">
            {rowIndices.map((idx) => {
              const mRow = summary.mergeRows[idx];
              const qRow = summary.quayVongRows[idx];
              const cRow = summary.catMoocRows[idx];

              return (
                <tr key={idx} className="hover:bg-slate-50/60">
                  {/* Ghép */}
                  <td className="px-2 py-1.5 border-r border-slate-200 text-center font-mono tabular-nums font-semibold text-amber-800">
                    {mRow ? mRow.quantity : ''}
                  </td>
                  <td className="px-3 py-1.5 border-r border-slate-200 text-slate-800">
                    {mRow ? (
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-blue-700">
                          {mRow.customerLabel}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">
                          {mRow.plateNumber}
                        </span>
                      </div>
                    ) : (
                      ''
                    )}
                  </td>

                  {/* Quay vòng */}
                  <td className="px-2 py-1.5 border-r border-slate-200 text-center font-mono tabular-nums font-semibold text-indigo-700">
                    {qRow ? qRow.quantity : ''}
                  </td>
                  <td className="px-3 py-1.5 border-r border-slate-200 text-slate-800">
                    {qRow ? (
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-blue-700">
                          {qRow.customerLabel}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">
                          {qRow.plateNumber} · {qRow.trailerInfo}
                        </span>
                      </div>
                    ) : (
                      ''
                    )}
                  </td>

                  {/* Cắt mooc */}
                  <td className="px-2 py-1.5 border-r border-slate-200 text-center font-mono tabular-nums font-semibold text-cyan-800">
                    {cRow ? cRow.quantity : ''}
                  </td>
                  <td className="px-3 py-1.5 border-r border-slate-200 text-slate-800">
                    {cRow ? (
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-blue-700">
                          {cRow.customerLabel}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">
                          {cRow.plateNumber} ({cRow.trailerInfo})
                        </span>
                      </div>
                    ) : (
                      ''
                    )}
                  </td>

                  <td className="px-3 py-1.5 text-center text-slate-400 font-mono text-[11px]">
                    —
                  </td>
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            <tr className="bg-[#EDF5E8] border-t border-slate-200 font-bold text-slate-900">
              <td className="px-2 py-2 border-r border-slate-200 text-center font-mono tabular-nums text-amber-800">
                {summary.mergeTotal}
              </td>
              <td className="px-3 py-2 border-r border-slate-200 text-[11px] font-medium text-slate-600">
                Tổng Ghép ({summary.mergeTotal * 2} chuyến)
              </td>
              <td className="px-2 py-2 border-r border-slate-200 text-center font-mono tabular-nums text-indigo-700">
                {summary.quayVongTotal}
              </td>
              <td className="px-3 py-2 border-r border-slate-200 text-[11px] font-medium text-slate-600">
                Tổng Quay vòng
              </td>
              <td className="px-2 py-2 border-r border-slate-200 text-center font-mono tabular-nums text-cyan-800">
                {summary.catMoocTotal}
              </td>
              <td className="px-3 py-2 border-r border-slate-200 text-[11px] font-medium text-slate-600">
                Tổng Cắt mooc
              </td>
              <td className="px-3 py-2 text-center font-mono tabular-nums text-blue-700 text-sm">
                {summary.grandTotalGroups}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
};
