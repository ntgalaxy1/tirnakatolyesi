import React, { useState } from 'react';
import { Clock, Wand2 } from 'lucide-react';
import { Language, NailCategory, SiteDesignItem } from '../types';
import { CATEGORY_LABELS, t } from '../i18n';
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
      className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
      aria-labelledby="site-gallery-heading"
    >
      {/* Header & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold text-[#D42663] tracking-wide">
            Tırnak Atölyesi • Official Salon & AI Nail Designs
          </p>
          <h2
            id="site-gallery-heading"
            className="text-2xl sm:text-3xl font-bold text-[#3B132A] mt-1.5"
          >
            {tr.siteGallerySectionTitle}
          </h2>
          <p className="text-sm sm:text-base text-[#3B132A]/75 mt-2 leading-relaxed">
            {tr.siteGallerySectionSubtitle}
          </p>
        </div>

        {/* Interactive Filter Segmented Control */}
        <div
          className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#FFFDFB] border border-[#3B132A]/15 overflow-x-auto max-w-full"
          role="tablist"
          aria-label="فیلتر دسته‌بندی طرح‌های ناخن"
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
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#3B132A] text-[#FFFDFB] shadow-sm'
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
        {filteredDesigns.map((design) => (
          <article
            key={design.id}
            data-testid={`site-design-card-${design.code}`}
            className="group rounded-3xl bg-[#FFFDFB] border border-[#3B132A]/12 overflow-hidden flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div>
              {/* 4:3 Nail Design Macro Photography */}
              <div className="relative aspect-[4/3] w-full bg-[#FAF0E6] overflow-hidden">
                <img
                  src={design.imageUrl}
                  alt={lang === 'fa' ? design.titleFa : design.titleTr}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                {/* Measured bottom gradient scrim */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#3B132A]/75 via-[#3B132A]/25 to-transparent p-4 flex items-center justify-between text-[#FFFDFB]">
                  <span className="font-mono text-xs font-bold tracking-wider">
                    {design.code}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/80"
                      style={{ backgroundColor: design.primaryColorHex }}
                      aria-hidden="true"
                    />
                    <span className="text-xs font-medium">
                      {CATEGORY_LABELS[design.category][lang]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Content with Zero-Pill Metadata Discipline */}
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2 text-xs text-[#3B132A]/65">
                  <span className="font-mono tabular-nums">{design.code}</span>
                  <span aria-hidden="true">·</span>
                  <span>{CATEGORY_LABELS[design.category][lang]}</span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <Clock className="w-3 h-3" />
                    {design.durationMin} {tr.durationUnit}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-[#3B132A] mt-2 leading-snug">
                  {lang === 'fa' ? design.titleFa : design.titleTr}
                </h3>

                <p className="text-sm font-bold text-[#D42663] tabular-nums mt-2">
                  {formatToman(design.priceToman, lang)}
                </p>
              </div>
            </div>

            {/* Primary Card CTA: Try on My Hand with AI */}
            <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0">
              <button
                type="button"
                onClick={() => onTryOnDesign(design)}
                className="w-full py-3 px-4 rounded-2xl bg-[#3B132A] text-[#FFFDFB] hover:bg-[#D42663] text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Wand2 className="w-4 h-4 shrink-0 text-[#E5A93B]" />
                <span>{tr.tryOnWithAiBtn}</span>
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
