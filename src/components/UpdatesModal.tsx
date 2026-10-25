import React from "react";
import updatesData from "../data/updates.json";

export interface UpdateItem {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

const UPDATES: UpdateItem[] = updatesData as UpdateItem[];

export const CURRENT_VERSION = UPDATES[0]?.version || "v2.1.0";

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
    <div
      className="fixed inset-0 z-100 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 print:hidden animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="updates-modal-title"
    >
      <div
        className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-2xl p-6 sm:p-7 w-full max-w-2xl flex flex-col gap-5 max-h-[88vh] overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b border-outline-variant/30 pb-4 gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-surface-container text-on-surface flex items-center justify-center border border-outline-variant/40 shrink-0">
              <span className="material-symbols-outlined text-xl">
                history_edu
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2
                  id="updates-modal-title"
                  className="text-xl sm:text-2xl font-display-title font-bold text-on-surface tracking-tight"
                >
                  Novedades y Registro de Versiones
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-surface-container text-on-surface border border-outline-variant/40 font-metadata-label">
                  {CURRENT_VERSION}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
                Historial de mejoras y evolución de la plataforma académica BUAP
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer shrink-0"
            aria-label="Cerrar modal"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Updates List */}
        <div className="flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar">
          {UPDATES.map((update, index) => {
            const isLatest = index === 0;
            return (
              <article
                key={update.version}
                className={`p-5 rounded-xl border transition-colors ${
                  isLatest
                    ? "bg-surface-container-low border-outline-variant/70"
                    : "bg-surface-container-lowest border-outline-variant/35"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg font-metadata-label ${
                        isLatest
                          ? "bg-on-surface text-surface"
                          : "bg-surface-container text-on-surface border border-outline-variant/40"
                      }`}
                    >
                      {update.version}
                    </span>
                    {isLatest && (
                      <span className="text-[10px] font-bold tracking-wider uppercase bg-surface-container-high text-on-surface border border-outline-variant/50 px-2 py-0.5 rounded-md">
                        Versión Actual
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-metadata-label text-on-surface-variant bg-surface-container-low px-2.5 py-1 rounded-lg border border-outline-variant/30 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">
                      calendar_today
                    </span>
                    <span>{update.date}</span>
                  </span>
                </div>

                <h3 className="font-display-title text-base sm:text-lg font-bold text-on-surface mb-3">
                  {update.title}
                </h3>

                <div className="space-y-2 border-l-2 border-outline-variant/50 pl-3.5">
                  {update.changes.map((change, i) => (
                    <p
                      key={i}
                      className="text-xs sm:text-sm text-on-surface-variant font-body-md leading-relaxed"
                    >
                      {change.replace(/^(▪️|>|\s*[-•])\s*/, "")}
                    </p>
                  ))}
                </div>
              </article>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3.5 border-t border-outline-variant/30 flex items-center justify-between flex-wrap gap-3">
          <span className="text-xs text-on-surface-variant font-metadata-label">
            Comunidad BUAP — Proyecto de Código Abierto
          </span>
          <button
            onClick={onClose}
            className="bg-on-surface text-surface hover:opacity-90 px-5 py-2.5 rounded-xl font-semibold transition-all active:scale-95 text-xs sm:text-sm ml-auto cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdatesModal;
