import { serializeMediaRef } from '../media/media.serializer.js';

export const serializePage = (page) => {
  const plain = typeof page.toObject === 'function' ? page.toObject() : page;

  return {
    id: plain._id,
    title: plain.title,
    slug: plain.slug,
    content: plain.content,
    status: plain.status,
    heroMedia: serializeMediaRef(plain.heroMedia),
    metaTitle: plain.metaTitle,
    metaDescription: plain.metaDescription,
    ogImageMedia: serializeMediaRef(plain.ogImageMedia),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const serializePageList = (pages) => pages.map(serializePage);
