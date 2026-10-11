"use client";

import React from "react";

interface AuthorModalProps {
  authorName: string;
  authorAvatar?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AuthorModal: React.FC<AuthorModalProps> = ({
  authorName,
  authorAvatar,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-xs bg-surface-container-lowest rounded-2xl p-5 shadow-xl border border-surface-container-high/50 flex flex-col items-center text-center gap-3">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-primary-fixed flex items-center justify-center shadow-sm">
          {authorAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
          ) : (
            <span className="material-symbols-outlined text-[32px] text-primary">person</span>
          )}
        </div>

        <div>
          <div className="flex items-center justify-center gap-1">
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">{authorName}</h3>
            <span className="material-symbols-outlined text-primary text-[16px]">verified</span>
          </div>
          <p className="font-body-sm text-body-sm text-secondary">SSC CGL Aspirant & Contributor</p>
        </div>

        {/* Minimal Practice Statistics */}
        <div className="w-full grid grid-cols-2 gap-2 bg-surface-container-low rounded-xl p-3 my-1">
          <div className="flex flex-col items-center">
            <span className="font-headline-sm text-headline-sm font-bold text-primary">48+</span>
            <span className="font-label-sm text-label-sm text-secondary">Questions Added</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-headline-sm text-headline-sm font-bold text-tertiary">84%</span>
            <span className="font-label-sm text-label-sm text-secondary">Avg Accuracy</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
