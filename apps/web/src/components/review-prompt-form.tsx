'use client';

import { COMMUNITY_REVIEW_PROMPTS, type CommunityReviewPromptMetric } from '@/lib/community-reviews';

type ReviewPromptFormProps = {
  productName?: string;
  values?: Partial<Record<CommunityReviewPromptMetric, number>>;
  onRatingChange?: (promptId: CommunityReviewPromptMetric, rating: number) => void;
};

export function ReviewPromptForm({ productName = 'this product', values, onRatingChange }: ReviewPromptFormProps) {
  return (
    <div className="grid gap-3 lg:grid-cols-2" aria-label={`Structured review prompts for ${productName}`}>
      {COMMUNITY_REVIEW_PROMPTS.map((prompt) => (
        <fieldset className="rounded-2xl border border-violet-100 bg-white p-4 text-sm shadow-sm" key={prompt.id}>
          <legend className="font-black text-slate-950">{prompt.label}</legend>
          <p className="mt-2 font-semibold leading-6 text-slate-700">{prompt.question}</p>
          <p className="mt-2 text-xs font-bold text-slate-500">{prompt.helper}</p>
          <label className="mt-3 block text-xs font-black uppercase tracking-[0.14em] text-violet-800" htmlFor={`review-prompt-${prompt.id}`}>
            {prompt.lowLabel} ⇄ {prompt.highLabel}
          </label>
          <input
            aria-label={`${prompt.label} rating`}
            className="mt-2 w-full accent-violet-700"
            defaultValue={values?.[prompt.id] ?? 4}
            id={`review-prompt-${prompt.id}`}
            max="5"
            min="1"
            name={`reviewPrompt.${prompt.id}`}
            onChange={(event) => onRatingChange?.(prompt.id, Number(event.target.value))}
            type="range"
          />
          <textarea
            className="mt-3 min-h-20 w-full rounded-2xl border border-violet-100 px-3 py-2 text-sm font-semibold text-slate-800"
            name={`reviewPrompt.${prompt.id}.note`}
            placeholder={`Optional ${prompt.label.toLowerCase()} note`}
          />
          <p className="mt-2 rounded-xl bg-violet-50 p-3 text-xs font-bold text-violet-950">Comparison signal: {prompt.trustReason}</p>
        </fieldset>
      ))}
    </div>
  );
}
