const serializeReporterRef = (ref) => {
  if (!ref) return null;
  if (typeof ref === 'object' && ref.displayName !== undefined) {
    return { id: ref._id.toString(), name: ref.displayName, phone: ref.phone, email: ref.email, customerCode: ref.customerCode };
  }
  return ref.toString();
};

const serializeAssigneeRef = (ref) => {
  if (!ref) return null;
  if (typeof ref === 'object' && ref.name !== undefined) return { id: ref._id.toString(), name: ref.name, email: ref.email };
  return ref.toString();
};

const serializeAttachmentRef = (ref) => {
  if (!ref) return null;
  if (typeof ref === 'object' && ref.cloudinary) return { id: ref._id.toString(), url: ref.cloudinary.secureUrl, type: ref.type };
  return ref.toString();
};

export const serializeIssue = (issue) => {
  const plain = typeof issue.toObject === 'function' ? issue.toObject() : issue;
  return {
    id: plain._id,
    issueNumber: plain.issueNumber,
    reporter: serializeReporterRef(plain.reporterId),
    category: plain.category,
    subCategory: plain.subCategory,
    entityType: plain.entityType,
    entityId: plain.entityId,
    description: plain.description,
    attachments: (plain.attachments ?? []).map(serializeAttachmentRef),
    priority: plain.priority,
    status: plain.status,
    source: plain.source,
    metadata: plain.metadata ?? {},
    assignedTo: serializeAssigneeRef(plain.assignedTo),
    resolutionNote: plain.resolutionNote,
    resolvedAt: plain.resolvedAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const serializeIssueList = (issues) => issues.map(serializeIssue);
