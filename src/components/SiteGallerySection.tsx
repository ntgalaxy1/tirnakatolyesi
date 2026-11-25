import React, { useState } from 'react';
import { Clock, Wand2 } from 'lucide-react';
import { Language, NailCategory, SiteDesignItem } from '../types';
import { CATEGORY_LABELS, getDesignTitle, NAIL_SHAPE_LABELS, t } from '../i18n';
import { filterDesignsByCategory, formatToman } from '../utils/bookingLogic';

interface SiteGallerySectionProps {
  lang: Language;
  designs: SiteDesignItem[];
  onTryOnDesign: (design: SiteDesignItem) => void;
}

const CATEGORIES: NailCategory[] = [
  'all',
  'gelish',
  'minimal',
  'french',
  'manicure',
  'pedicure',
  'ombre',
];

export const SiteGallerySection: React.FC<SiteGallerySectionProps> = ({
  lang,
  designs,
  onTryOnDesign,
}) => {
  const [activeCategory, setActiveCategory] = useState<NailCategory>('all');
  const tr = t(lang);

  const filteredDesigns = filterDesignsByCategory(designs, activeCategory);

  return (
    <section
      id="site-gallery"
      className="py-12 sm:py-14 w-full max-w-6xl mx-auto px-4 sm:px-6 overflow-hidden text-start min-w-0"
      aria-labelledby="site-gallery-heading"
    >
      {/* Header & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 w-full max-w-full min-w-0">
        <div className="max-w-2xl min-w-0">
          <p className="text-xs font-semibold text-[#D42663] tracking-wide break-words">
            {tr.siteGallerySectionBadge}
          </p>
          <h2
            id="site-gallery-heading"
            className="text-2xl sm:text-3xl font-bold text-[#3B132A] mt-1.5 break-words"
          >
            {tr.siteGallerySectionTitle}
          </h2>
          <p className="text-sm sm:text-base text-[#3B132A]/75 mt-2 leading-relaxed break-words">
            {tr.siteGallerySectionSubtitle}
          </p>
        </div>

        {/* Interactive Filter Segmented Control — wraps cleanly on small mobile screens */}
        <div
          className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-[#FFFDFB] border border-[#3B132A]/15 w-full md:w-auto max-w-full min-w-0"
          role="tablist"
          aria-label={tr.siteGallerySectionTitle}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer break-words min-w-0 ${
                  isActive
                    ? 'bg-[#3B132A] text-[#FFFDFB] shadow-xs'
                    : 'text-[#3B132A]/75 hover:text-[#3B132A] hover:bg-[#FAF0E6]'
                }`}
              >
                {CATEGORY_LABELS[cat][lang]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3-Column Boutique Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 w-full max-w-full min-w-0">
        {filteredDesigns.map((design) => {
          const localizedTitle = getDesignTitle(design, lang);
          return (
            <article
              key={design.id}
              data-testid={`site-design-card-${design.code}`}
              className="group w-full max-w-full min-w-0 rounded-3xl bg-[#FFFDFB] border border-[#3B132A]/12 overflow-hidden flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md text-start"
            >
              <div className="w-full max-w-full min-w-0">
                {/* Fixed Aspect-Ratio Nail Design Frame (w-full aspect-square object-cover overflow-hidden) */}
                <div className="relative w-full aspect-square bg-[#FAF0E6] overflow-hidden">
                  <img
                    src={design.imageUrl}
                    alt={localizedTitle}
                    className="w-full h-full aspect-square object-cover overflow-hidden transition-transform duration-300 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  {/* Measured bottom gradient scrim */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#3B132A]/75 via-[#3B132A]/25 to-transparent p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-2 text-[#FFFDFB]">
                    <span className="font-mono text-xs font-bold tracking-wider break-words">
                      {design.code}
                    </span>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/80 shrink-0"
                        style={{ backgroundColor: design.primaryColorHex }}
                        aria-hidden="true"
                      />
                      <span className="text-xs font-medium break-words">
                        {CATEGORY_LABELS[design.category][lang]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Content with Zero-Pill Metadata Discipline */}
                <div className="p-4 sm:p-6 w-full max-w-full min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#3B132A]/65 min-w-0">
                    <span className="font-mono tabular-nums break-words">{design.code}</span>
                    <span aria-hidden="true">·</span>
                    <span className="break-words">{CATEGORY_LABELS[design.category][lang]}</span>
                    <span aria-hidden="true">·</span>
                    <span className="break-words">{NAIL_SHAPE_LABELS[design.defaultShape]?.[lang]}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 tabular-nums break-words">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>
                        {design.durationMin} {tr.durationUnit}
                      </span>
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-[#3B132A] mt-2 leading-snug break-words">
                    {localizedTitle}
                  </h3>

                  <p className="text-sm font-bold text-[#D42663] tabular-nums mt-2 break-words">
                    {formatToman(design.priceToman, lang)}
                  </p>
                </div>
              </div>

              {/* Primary Card CTA: Try on My Hand */}
              <div className="px-4 pb-4 sm:px-6 sm:pb-6 pt-0 w-full max-w-full min-w-0">
                <button
                  type="button"
                  onClick={() => onTryOnDesign(design)}
                  className="w-full max-w-full min-w-0 py-3 px-4 rounded-2xl bg-[#3B132A] text-[#FFFDFB] hover:bg-[#D42663] text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer break-words"
                >
                  <Wand2 className="w-4 h-4 shrink-0 text-[#E5A93B]" />
                  <span className="break-words">{tr.tryOnWithAiBtn}</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
