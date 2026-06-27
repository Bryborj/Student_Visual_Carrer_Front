import React from "react";
import updatesData from "../data/updates.json";
import wolfLogo from "../resources/wolf.svg";

export interface UpdateItem {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

const UPDATES: UpdateItem[] = updatesData as UpdateItem[];

export const CURRENT_VERSION = UPDATES[0]?.version || "v1.2.0";

interface UpdatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpdatesModal: React.FC<UpdatesModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 print:hidden animate-fadeIn">
      <div className="bg-surface border border-outline-variant rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl flex flex-col gap-6 max-h-[88vh] overflow-hidden relative">
        {/* Glow background effects */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex justify-between items-center border-b border-outline-variant pb-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <span className="material-symbols-outlined text-2xl animate-pulse">
                campaign
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-display-title font-bold text-on-surface tracking-tight">
                  Novedades & Evolución
                </h2>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {CURRENT_VERSION}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-on-surface-variant">
                Descubre las mejoras implementadas para tu plan de estudios
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all hover:scale-110"
            aria-label="Cerrar modal"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Updates Timeline */}
        <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar relative z-10 my-1">
          {UPDATES.map((update, index) => {
            const isLatest = index === 0;
            return (
              <div
                key={update.version}
                className={`p-5 rounded-2xl border transition-all ${
                  isLatest
                    ? "bg-surface-container-lowest border-emerald-500/40 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500/20"
                    : "bg-surface-container/40 border-outline-variant/60 opacity-85 hover:opacity-100"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-base font-extrabold px-3 py-1 rounded-xl ${
                        isLatest
                          ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm"
                          : "bg-surface text-on-surface border border-outline-variant"
                      }`}
                    >
                      {update.version}
                    </span>
                    {isLatest && (
                      <span className="text-[10px] font-bold tracking-wider uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping"></span>
                        Nuevo
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-on-surface-variant bg-surface px-2.5 py-1 rounded-lg border border-outline-variant/60 flex items-center">
                    <span className="material-symbols-outlined text-xl animate-pulse mr-2">
                      calendar_month
                    </span>
                    {update.date}
                  </span>
                </div>

                <h4
                  className={`text-base font-bold mb-3 ${isLatest ? "text-emerald-400" : "text-primary"}`}
                >
                  {update.title}
                </h4>

                <ul className="space-y-2.5">
                  {update.changes.map((change, i) => (
                    <li
                      key={i}
                      className="text-sm text-on-surface-variant font-body-md flex items-start gap-2.5"
                    >
                      <span className="text-emerald-500 font-bold leading-none mt-0.5">
                        •
                      </span>
                      <span className="leading-relaxed flex-1">
                        {change.replace(/^▪️\s*/, "")}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-outline-variant flex items-center justify-between relative z-10 flex-wrap gap-3">
          <span className="text-xs text-on-surface-variant flex items-center gap-1.5">
            💡 Mantente al tanto de las próximas funcionalidades del ecosistema
            BUAP.
          </span>
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95 text-sm ml-auto"
          >
            ¡Explorar Mejoras!
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdatesModal;
