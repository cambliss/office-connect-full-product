"use client";

import { useState } from "react";
import { Rating } from "@/components/commerce/CommercePrimitives";

export interface SpecItem {
  key: string;
  value: string;
}

export interface ReviewItem {
  id: string;
  author: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
}

export const ProductSpecsAndReviews = ({
  specifications,
  reviews = [],
  overallRating,
  totalReviews,
}: {
  specifications: SpecItem[];
  reviews: ReviewItem[];
  overallRating?: number;
  totalReviews?: number;
}) => {
  const [activeTab, setActiveTab] = useState<"specs" | "reviews">("specs");
  const computedTotalReviews = totalReviews !== undefined ? totalReviews : reviews.length;
  const computedOverallRating = overallRating !== undefined ? overallRating : (reviews.length > 0 ? 5.0 : 0);

  return (
    <section className="space-y-6 pt-8 border-t border-slate-200 select-none">
      
      {/* Navigation Tabs */}
      <div className="flex items-center gap-6 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("specs")}
          className={`pb-3 text-sm font-extrabold transition relative ${
            activeTab === "specs"
              ? "text-[#404d85] border-b-2 border-[#404d85]"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Technical Specifications ({specifications.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reviews")}
          className={`pb-3 text-sm font-extrabold transition relative ${
            activeTab === "reviews"
              ? "text-[#404d85] border-b-2 border-[#404d85]"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Customer Reviews ({computedTotalReviews.toLocaleString()})
        </button>
      </div>

      {/* 1. TECHNICAL SPECIFICATIONS TAB */}
      {activeTab === "specs" && (
        <div className="border border-slate-200 rounded-[8px] overflow-hidden bg-white shadow-2xs">
          <table className="w-full text-xs border-collapse">
            <tbody className="divide-y divide-slate-100">
              {specifications.map((spec, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? "bg-slate-50/50" : "bg-white"}>
                  <td className="py-2.5 px-4 font-bold text-slate-500 w-1/3 border-r border-slate-100">
                    {spec.key}
                  </td>
                  <td className="py-2.5 px-4 text-slate-800 font-semibold">{spec.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. CUSTOMER REVIEWS TAB */}
      {activeTab === "reviews" && (
        <div className="space-y-8">
          {reviews.length === 0 ? (
            <div className="p-8 rounded-[8px] bg-slate-50 border border-slate-200 text-center space-y-2">
              <span className="text-2xl block">⭐</span>
              <h4 className="font-extrabold text-sm text-slate-800">No Verified Customer Reviews Yet</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Be the first verified buyer to purchase this SKU and leave authentic feedback.
              </p>
            </div>
          ) : (
            <>
              {/* Reviews Score Card */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 rounded-[8px] bg-slate-50 border border-slate-200">
                <div className="md:col-span-4 flex flex-col items-center justify-center text-center space-y-1 md:border-r md:border-slate-200 pr-4">
                  <span className="text-4xl font-black text-slate-900">{computedOverallRating.toFixed(1)}</span>
                  <Rating score={computedOverallRating} />
                  <span className="text-xs text-slate-500">Based on {computedTotalReviews.toLocaleString()} verified buyer ratings</span>
                </div>

                <div className="md:col-span-8 space-y-2 justify-center flex flex-col">
                  {[
                    { stars: 5, pct: 100 },
                    { stars: 4, pct: 0 },
                    { stars: 3, pct: 0 },
                    { stars: 2, pct: 0 },
                    { stars: 1, pct: 0 },
                  ].map((bar) => (
                    <div key={bar.stars} className="flex items-center gap-3 text-xs">
                      <span className="w-10 font-bold text-slate-600 shrink-0">{bar.stars} Star</span>
                      <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: `${bar.pct}%` }} />
                      </div>
                      <span className="w-8 text-right font-semibold text-slate-500">{bar.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Individual Reviews List */}
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-[8px] border border-slate-200 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Rating score={rev.rating} />
                        <span className="font-extrabold text-xs text-slate-900">{rev.title}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">{rev.date}</span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <span className="font-bold text-slate-800">{rev.author}</span>
                        {rev.isVerifiedPurchase && (
                          <span className="text-emerald-700 font-bold">✓ Verified Purchase</span>
                        )}
                      </div>
                      <button type="button" className="text-slate-500 hover:text-slate-800 font-medium">
                        Helpful ({rev.helpfulCount})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

    </section>
  );
};
