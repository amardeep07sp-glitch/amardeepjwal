import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Paperclip, Play, Star, ThumbsUp, X } from 'lucide-react';
import { useProductReviews } from '@/features/reviews/reviewsApi';
import { useMyReview, useSubmitReview, useDeleteMyReview } from '@/features/storefront/storefrontApi';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/global/Pagination';
import { ReportReviewButton } from './ReportReviewButton';
import { compressImage } from '@/lib/compressImage';
import { cn } from '@/lib/utils';

const MAX_REVIEW_ATTACHMENTS = 5;

function StarPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const star = i + 1;
        return (
          <button key={star} type="button" onClick={() => onChange(star)} aria-label={`${star} star`}>
            <Star className={cn('size-6 transition-colors', star <= value ? 'fill-warning text-warning' : 'text-muted-foreground/30 hover:text-warning/50')} />
          </button>
        );
      })}
    </div>
  );
}

function StarDisplay({ rating, size = 'size-3.5' }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn(size, i < Math.round(rating) ? 'fill-warning text-warning' : 'text-muted-foreground/30')} />
      ))}
    </div>
  );
}

function RatingBreakdown({ summary }) {
  const total = summary.count || 1;
  return (
    <div className="flex flex-col gap-1.5">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = summary.breakdown?.[star] ?? 0;
        const pct = Math.round((count / total) * 100);
        return (
          <div key={star} className="flex items-center gap-2 text-xs">
            <span className="w-8 text-muted-foreground">{star} star</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-warning" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-6 text-right text-muted-foreground">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

function WriteReviewForm({ productId, existingReview, onDone }) {
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [title, setTitle] = useState(existingReview?.title ?? '');
  const [comment, setComment] = useState(existingReview?.comment ?? '');
  const [files, setFiles] = useState([]);
  const [formError, setFormError] = useState('');
  const [justSubmitted, setJustSubmitted] = useState(false);
  const submitReview = useSubmitReview();

  const handleFilesChange = (e) => {
    const picked = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...picked].slice(0, MAX_REVIEW_ATTACHMENTS));
    e.target.value = '';
  };

  const removeFile = (index) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (rating === 0) {
      setFormError('Please select a star rating.');
      return;
    }
    // Multipart only when there are actually files to send - a plain JSON
    // body for the common no-photo case keeps this identical to how the
    // endpoint behaved before attachments existed.
    const payload = files.length
      ? await (async () => {
          const formData = new FormData();
          formData.append('rating', String(rating));
          formData.append('title', title);
          formData.append('comment', comment);
          const compressed = await Promise.all(files.map(compressImage));
          compressed.forEach((file) => formData.append('attachments', file));
          return formData;
        })()
      : { rating, title, comment };

    try {
      await submitReview.mutateAsync({ productId, payload });
      setJustSubmitted(true);
      setFiles([]);
    } catch (err) {
      setFormError(err.message);
    }
  };

  if (justSubmitted) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl bg-secondary/40 p-4 text-center ring-1 ring-border sm:p-5">
        <p className="text-sm font-semibold text-heading">Thanks for your review!</p>
        <p className="text-xs text-muted-foreground">
          It's awaiting approval and will appear here once our team reviews it - usually within a day.
        </p>
        <Button type="button" variant="outline" size="sm" className="mx-auto mt-1" onClick={() => onDone?.()}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl bg-secondary/40 p-4 ring-1 ring-border sm:p-5">
      <p className="text-sm font-semibold text-heading">{existingReview ? 'Edit Your Review' : 'Write a Review'}</p>
      <StarPicker value={rating} onChange={setRating} />
      <Input placeholder="Review title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Textarea placeholder="Share your experience with this product..." rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />

      <div className="flex flex-col gap-2">
        <label className="flex w-fit cursor-pointer items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <Paperclip className="size-3.5" />
          Add photos or a video (optional)
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFilesChange}
            disabled={files.length >= MAX_REVIEW_ATTACHMENTS}
          />
        </label>
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map((file, index) => (
              <span
                key={`${file.name}-${index}`}
                className="flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 text-xs text-foreground ring-1 ring-border"
              >
                {file.type.startsWith('video/') ? <Play className="size-3 shrink-0" /> : null}
                <span className="max-w-32 truncate">{file.name}</span>
                <button type="button" onClick={() => removeFile(index)} aria-label={`Remove ${file.name}`}>
                  <X className="size-3 text-muted-foreground hover:text-destructive" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {formError && <p className="text-sm text-destructive">{formError}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" variant="luxury" size="sm" loading={submitReview.isPending}>
          Submit Review
        </Button>
        {onDone && (
          <Button type="button" variant="ghost" size="sm" onClick={onDone}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

export function ReviewsSection({ productId, slug }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [page, setPage] = useState(1);
  const [isWriting, setIsWriting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const { data, isLoading } = useProductReviews(slug, { page, limit: 5 });
  const { data: myReview } = useMyReview(user ? productId : undefined);
  const deleteMyReview = useDeleteMyReview();

  useEffect(() => setPage(1), [slug]);

  const summary = data?.summary ?? { average: 0, count: 0, breakdown: {} };

  const handleDeleteReview = async () => {
    setDeleteError('');
    try {
      await deleteMyReview.mutateAsync(productId);
    } catch (err) {
      setDeleteError(err.message);
    }
  };

  return (
    <div id="reviews" className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-[240px_1fr]">
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-card p-5 text-center ring-1 ring-border sm:items-start sm:text-left">
          <p className="text-4xl font-bold text-heading">{summary.average.toFixed(1)}</p>
          <StarDisplay rating={summary.average} size="size-4" />
          <p className="text-xs text-muted-foreground">{summary.count} review{summary.count === 1 ? '' : 's'}</p>
          <div className="mt-3 w-full">
            <RatingBreakdown summary={summary} />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {!isWriting && (
            <div>
              {!user ? (
                <Button variant="outline" onClick={() => navigate('/login')}>
                  Sign in to write a review
                </Button>
              ) : myReview ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => setIsWriting(true)}>
                      Edit Your Review
                    </Button>
                    <Button variant="ghost" size="sm" loading={deleteMyReview.isPending} onClick={handleDeleteReview}>
                      Delete
                    </Button>
                    {myReview.status === 'pending' && <span className="text-xs text-muted-foreground">Awaiting approval</span>}
                  </div>
                  {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
                </div>
              ) : (
                <Button variant="outline" onClick={() => setIsWriting(true)}>
                  <ThumbsUp className="size-4" /> Write a Review
                </Button>
              )}
            </div>
          )}

          {isWriting && (
            <WriteReviewForm productId={productId} existingReview={myReview} onDone={() => setIsWriting(false)} />
          )}

          {isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : data?.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reviews yet - be the first to share your experience.</p>
          ) : (
            <div className="flex flex-col gap-4 divide-y divide-border">
              {data?.items.map((review) => (
                <div key={review.id} className="pt-4 first:pt-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <StarDisplay rating={review.rating} />
                      {review.isVerifiedPurchase && (
                        <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success uppercase">Verified Purchase</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {review.title && <p className="mt-1.5 text-sm font-semibold text-heading">{review.title}</p>}
                  {review.comment && <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>}
                  {review.attachments?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {review.attachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={attachment.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group relative size-16 shrink-0 overflow-hidden rounded-lg bg-secondary ring-1 ring-border"
                        >
                          {attachment.type === 'video' ? (
                            <>
                              <video src={attachment.url} className="size-full object-cover" muted />
                              <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white">
                                <Play className="size-5" />
                              </span>
                            </>
                          ) : (
                            <img src={attachment.url} alt="Review attachment" className="size-full object-cover" loading="lazy" />
                          )}
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-foreground">{review.reviewerName}</p>
                    {user && <ReportReviewButton reviewId={review.id} />}
                  </div>
                </div>
              ))}
            </div>
          )}

          {data?.meta && data.meta.totalPages > 1 && (
            <Pagination page={data.meta.page} totalPages={data.meta.totalPages} totalItems={data.meta.totalItems} onPageChange={setPage} />
          )}
        </div>
      </div>
    </div>
  );
}
