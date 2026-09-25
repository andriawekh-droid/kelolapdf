'use client';

import React from 'react';
import { PdfTool } from '@/data/tools';
import { DynamicIcon } from './DynamicIcon';
import { ArrowUpRight } from 'lucide-react';

interface ToolCardProps {
  tool: PdfTool;
  onSelect: (tool: PdfTool) => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(tool)}
      className="notion-card group relative bg-white border border-stone-200 hover:border-stone-400/90 rounded-2xl p-5 cursor-pointer shadow-xs hover:shadow-[0_8px_24px_-6px_rgba(28,25,23,0.08)] flex flex-col justify-between transition-all"
    >
      <div>
        {/* Top Header: Playful Sticker Icon & Badge */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div
            className={`w-12 h-12 rounded-xl border ${tool.accentBg} ${tool.accentBorder} flex items-center justify-center relative transition-transform duration-200 group-hover:scale-105 group-hover:rotate-[-2deg]`}
          >
            {/* Playful Emoji floating on top corner */}
            <span className="absolute -top-1.5 -left-1.5 text-xs select-none">
              {tool.emoji}
            </span>
            <DynamicIcon name={tool.iconName} className={`w-6 h-6 ${tool.accentText}`} />
          </div>

          <div className="flex items-center gap-1.5">
            {tool.badge && (
              <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200/80">
                {tool.badge}
              </span>
            )}
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 group-hover:text-stone-900 group-hover:bg-stone-100 transition-colors">
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-stone-900 text-base mb-1.5 group-hover:text-amber-800 transition-colors">
          {tool.title}
        </h3>

        {/* Description */}
        <p className="text-stone-500 text-xs leading-relaxed line-clamp-2">
          {tool.shortDesc}
        </p>
      </div>

      {/* Bottom Category Pill */}
      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
        <span>{tool.categoryName}</span>
        <span className="text-amber-600 opacity-0 group-hover:opacity-100 font-medium transition-opacity">
          Buka Alat →
        </span>
      </div>
    </div>
  );
};
