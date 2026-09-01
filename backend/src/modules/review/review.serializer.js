const serializeCustomerRef = (ref) => {
  if (!ref) return null;
  if (ref.displayName !== undefined) return { id: ref._id.toString(), name: ref.displayName };
  return ref.toString();
};

const serializeProductRef = (ref) => {
  if (!ref) return null;
  if (ref.name !== undefined) return { id: ref._id.toString(), name: ref.name, slug: ref.slug };
  return ref.toString();
};

const serializeAttachmentRef = (ref) => {
  if (!ref) return null;
  if (typeof ref === 'object' && ref.cloudinary) return { id: ref._id.toString(), url: ref.cloudinary.secureUrl, type: ref.type };
  return ref.toString();
};

// Public shape (product page listing) - reviewer name only, never their
// customer id/contact info.
export const serializePublicReview = (review) => {
  const plain = typeof review.toObject === 'function' ? review.toObject() : review;
  return {
    id: plain._id,
    reviewerName: plain.customer?.displayName ?? 'Anonymous',
    rating: plain.rating,
    title: plain.title,
    comment: plain.comment,
    isVerifiedPurchase: plain.isVerifiedPurchase,
    attachments: (plain.attachments ?? []).map(serializeAttachmentRef),
    createdAt: plain.createdAt,
  };
};

export const serializePublicReviewList = (reviews) => reviews.map(serializePublicReview);

// Homepage testimonials - same reviewer-name-only privacy rule as
// serializePublicReview, plus which product this is real feedback about
// (the card links back to it, unlike the old invented-quote cards which
// linked nowhere).
export const serializePublicFeaturedReview = (review) => {
  const plain = typeof review.toObject === 'function' ? review.toObject() : review;
  return {
    id: plain._id,
    reviewerName: plain.customer?.displayName ?? 'Anonymous',
    rating: plain.rating,
    title: plain.title,
    comment: plain.comment,
    isVerifiedPurchase: plain.isVerifiedPurchase,
    product: serializeProductRef(plain.product),
    createdAt: plain.createdAt,
  };
};

export const serializePublicFeaturedReviewList = (reviews) => reviews.map(serializePublicFeaturedReview);

// Full shape - the reviewer's own read of their review, and the admin
// moderation queue.
export const serializeReview = (review) => {
  const plain = typeof review.toObject === 'function' ? review.toObject() : review;
  return {
    id: plain._id,
    product: serializeProductRef(plain.product),
    customer: serializeCustomerRef(plain.customer),
    rating: plain.rating,
    title: plain.title,
    comment: plain.comment,
    isVerifiedPurchase: plain.isVerifiedPurchase,
    attachments: (plain.attachments ?? []).map(serializeAttachmentRef),
    status: plain.status,
    moderatedAt: plain.moderatedAt,
    reportCount: plain.reportCount ?? 0,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const serializeReviewList = (reviews) => reviews.map(serializeReview);

export const serializeReportedReviewItem = ({ review, pendingReportCount, reasons, latestReportAt }) => ({
  review: serializeReview(review),
  pendingReportCount,
  reasons,
  latestReportAt,
});

export const serializeReportedReviewList = (items) => items.map(serializeReportedReviewItem);

export const serializeReviewReport = (report) => {
  const plain = typeof report.toObject === 'function' ? report.toObject() : report;
  return {
    id: plain._id,
    reporter: serializeCustomerRef(plain.reporterId),
    reason: plain.reason,
    description: plain.description,
    status: plain.status,
    resolvedAt: plain.resolvedAt,
    createdAt: plain.createdAt,
  };
};

export const serializeReviewReportList = (reports) => reports.map(serializeReviewReport);
