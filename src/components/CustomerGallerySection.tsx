import React from 'react';
import { CustomerGalleryItem, Language } from '../types';
import { t } from '../i18n';

interface CustomerGallerySectionProps {
  lang: Language;
  items: CustomerGalleryItem[];
}

export const CustomerGallerySection: React.FC<CustomerGallerySectionProps> = ({
  lang,
  items,
}) => {
  const tr = t(lang);

  return (
    <section
      id="customer-gallery"
      className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
      aria-labelledby="customer-gallery-heading"
    >
      <div className="max-w-3xl mb-10">
        <p className="text-xs font-semibold text-[#7B2869] tracking-wide">
          Tırnak Atölyesi • Verified Customer Showcase
        </p>
        <h2
          id="customer-gallery-heading"
          className="text-2xl sm:text-3xl font-bold text-[#3B132A] mt-1.5"
        >
          {tr.customerGallerySectionTitle}
        </h2>
        <p className="text-sm sm:text-base text-[#3B132A]/75 mt-2 leading-relaxed">
          {tr.customerGallerySectionSubtitle}
        </p>
      </div>

      <div
        data-testid="customer-showcase-grid"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-3xl bg-[#FFFDFB] border border-[#3B132A]/12 overflow-hidden flex flex-col justify-between shadow-sm"
          >
            <div className="relative aspect-[4/3] w-full bg-[#FAF0E6] overflow-hidden">
              <img
                src={item.imageUrl}
                alt={`${item.customerFirstName} - ${item.serviceLabelFa}`}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              {item.designCode && (
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-[#3B132A]/80 backdrop-blur-sm text-[#FFFDFB] font-mono text-[11px]">
                  {item.designCode}
                </div>
              )}
            </div>

            <div className="p-5 space-y-2.5">
              {/* Unboxed Metadata with typographic separators */}
              <div className="flex items-center gap-2 text-xs text-[#3B132A]/65">
                <span className="font-semibold text-[#D42663]">
                  {tr.customerCardPrefix} {item.customerFirstName}
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{item.dateFa}</span>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-[#3B132A]">
                {lang === 'fa' ? item.serviceLabelFa : item.serviceLabelTr}
              </h3>

              {(item.commentFa || item.commentTr) && (
                <p className="text-xs text-[#3B132A]/75 leading-relaxed">
                  «{lang === 'fa' ? item.commentFa : item.commentTr}»
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
