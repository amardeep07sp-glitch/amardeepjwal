const serializeCustomerRef = (ref) => {
  if (!ref) return null;
  if (typeof ref === 'object' && ref.displayName !== undefined) {
    return { id: ref._id.toString(), name: ref.displayName, phone: ref.phone, email: ref.email, customerCode: ref.customerCode };
  }
  return ref.toString();
};

const serializeAgentRef = (ref) => {
  if (!ref) return null;
  if (typeof ref === 'object' && ref.name !== undefined) return { id: ref._id.toString(), name: ref.name, email: ref.email };
  return ref.toString();
};

export const serializeTicket = (ticket) => {
  const plain = typeof ticket.toObject === 'function' ? ticket.toObject() : ticket;
  return {
    id: plain._id,
    ticketNumber: plain.ticketNumber,
    customer: serializeCustomerRef(plain.customer),
    subject: plain.subject,
    category: plain.category,
    priority: plain.priority,
    status: plain.status,
    source: plain.source,
    context: plain.context ?? {},
    assignedAgent: serializeAgentRef(plain.assignedAgentId),
    firstResponseAt: plain.firstResponseAt,
    resolvedAt: plain.resolvedAt,
    closedAt: plain.closedAt,
    firstResponseDueAt: plain.firstResponseDueAt ?? null,
    resolutionDueAt: plain.resolutionDueAt ?? null,
    slaBreached: plain.slaBreached ?? false,
    slaBreachedAt: plain.slaBreachedAt ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const serializeTicketList = (tickets) => tickets.map(serializeTicket);

const serializeSenderRef = (ref) => {
  if (!ref) return null;
  if (typeof ref === 'object' && ref.name !== undefined) return { id: ref._id.toString(), name: ref.name };
  return ref.toString();
};

const serializeAttachmentRef = (ref) => {
  if (!ref) return null;
  if (typeof ref === 'object' && ref.cloudinary) return { id: ref._id.toString(), url: ref.cloudinary.secureUrl, type: ref.type };
  return ref.toString();
};

export const serializeTicketMessage = (message) => {
  const plain = typeof message.toObject === 'function' ? message.toObject() : message;
  return {
    id: plain._id,
    ticket: plain.ticket?.toString?.() ?? plain.ticket,
    sender: serializeSenderRef(plain.senderId),
    senderRole: plain.senderRole,
    type: plain.type,
    content: plain.content,
    attachments: (plain.attachments ?? []).map(serializeAttachmentRef),
    readAt: plain.readAt,
    createdAt: plain.createdAt,
  };
};

export const serializeTicketMessageList = (messages) => messages.map(serializeTicketMessage);
