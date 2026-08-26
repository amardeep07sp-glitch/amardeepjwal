const serializeRef = (ref) => {
  if (ref == null) return null;
  if (typeof ref === 'object' && ref.name !== undefined) return { id: ref._id.toString(), name: ref.name, slug: ref.slug };
  return ref.toString();
};

export const serializeHelpArticle = (article) => {
  const plain = typeof article.toObject === 'function' ? article.toObject() : article;
  return {
    id: plain._id,
    title: plain.title,
    slug: plain.slug,
    category: plain.category,
    content: plain.content,
    summary: plain.summary,
    tags: plain.tags ?? [],
    relatedProducts: (plain.relatedProducts ?? []).map(serializeRef),
    status: plain.status,
    featured: plain.featured,
    displayOrder: plain.displayOrder,
    seoTitle: plain.seoTitle,
    seoDescription: plain.seoDescription,
    viewCount: plain.viewCount,
    helpfulCount: plain.helpfulCount,
    notHelpfulCount: plain.notHelpfulCount,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const serializeHelpArticleList = (articles) => articles.map(serializeHelpArticle);

// The customer-facing shape - never leaks displayOrder/counters an admin
// wouldn't want a competitor scraping (helpfulCount/notHelpfulCount are
// shown back to the SAME user who just voted via the vote response, not
// embedded in every article read).
export const serializePublicHelpArticle = (article) => {
  const plain = typeof article.toObject === 'function' ? article.toObject() : article;
  return {
    id: plain._id,
    title: plain.title,
    slug: plain.slug,
    category: plain.category,
    content: plain.content,
    summary: plain.summary,
    tags: plain.tags ?? [],
    relatedProducts: (plain.relatedProducts ?? []).map(serializeRef),
    featured: plain.featured,
    seoTitle: plain.seoTitle,
    seoDescription: plain.seoDescription,
    updatedAt: plain.updatedAt,
  };
};

export const serializePublicHelpArticleList = (articles) => articles.map(serializePublicHelpArticle);
