import React from 'react';
import { CustomerGalleryItem, Language } from '../types';
import { getCustomerComment, getCustomerServiceLabel, t } from '../i18n';

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
      className="py-12 sm:py-14 w-full max-w-6xl mx-auto px-4 sm:px-6 overflow-hidden text-start min-w-0"
      aria-labelledby="customer-gallery-heading"
    >
      <div className="max-w-3xl mb-10 min-w-0">
        <p className="text-xs font-semibold text-[#7B2869] tracking-wide break-words">
          {tr.customerGallerySectionBadge}
        </p>
        <h2
          id="customer-gallery-heading"
          className="text-2xl sm:text-3xl font-bold text-[#3B132A] mt-1.5 break-words"
        >
          {tr.customerGallerySectionTitle}
        </h2>
        <p className="text-sm sm:text-base text-[#3B132A]/75 mt-2 leading-relaxed break-words">
          {tr.customerGallerySectionSubtitle}
        </p>
      </div>

      <div
        data-testid="customer-showcase-grid"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-full min-w-0"
      >
        {items.map((item) => {
          const serviceLabel = getCustomerServiceLabel(item, lang);
          const comment = getCustomerComment(item, lang);
          return (
            <article
              key={item.id}
              className="w-full max-w-full min-w-0 rounded-3xl bg-[#FFFDFB] border border-[#3B132A]/12 overflow-hidden flex flex-col justify-between shadow-xs text-start"
            >
              <div className="relative w-full aspect-square bg-[#FAF0E6] overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={`${item.customerFirstName} - ${serviceLabel}`}
                  className="w-full h-full aspect-square object-cover overflow-hidden"
                  referrerPolicy="no-referrer"
                />
                {item.designCode && (
                  <div className="absolute top-3 start-3 px-2.5 py-1 rounded-lg bg-[#3B132A]/80 backdrop-blur-xs text-[#FFFDFB] font-mono text-[11px] break-words">
                    {item.designCode}
                  </div>
                )}
              </div>

              <div className="p-4 sm:p-5 space-y-2.5 w-full max-w-full min-w-0">
                {/* Unboxed Metadata with typographic separators */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#3B132A]/65 min-w-0">
                  <span className="font-semibold text-[#D42663] break-words">
                    {tr.customerCardPrefix} {item.customerFirstName}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums break-words">
                    {lang === 'fa' ? item.dateFa : item.dateIso || item.dateFa}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-[#3B132A] break-words">
                  {serviceLabel}
                </h3>

                {comment && (
                  <p className="text-xs text-[#3B132A]/75 leading-relaxed break-words">
                    «{comment}»
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
