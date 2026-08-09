const serializeUserRef = (ref) => {
  if (!ref) return null;
  if (ref.name !== undefined) return { id: ref._id.toString(), name: ref.name };
  return ref.toString();
};

export const serializeJournal = (journal) => {
  const plain = typeof journal.toObject === 'function' ? journal.toObject() : journal;
  return {
    id: plain._id,
    journalNumber: plain.journalNumber,
    date: plain.date,
    eventType: plain.eventType,
    referenceType: plain.referenceType,
    referenceId: plain.referenceId?.toString?.() ?? plain.referenceId,
    narration: plain.narration,
    status: plain.status,
    reversalOf: plain.reversalOf?.toString?.() ?? plain.reversalOf,
    totalAmount: plain.totalAmount,
    postedBy: serializeUserRef(plain.postedBy),
    postedAt: plain.postedAt,
    createdAt: plain.createdAt,
  };
};

export const serializeJournalList = (journals) => journals.map(serializeJournal);

export const serializeJournalLine = (line) => {
  const plain = typeof line.toObject === 'function' ? line.toObject() : line;
  return {
    id: plain._id,
    journal: plain.journal?.toString?.() ?? plain.journal,
    account: plain.account && plain.account.code !== undefined
      ? { id: plain.account._id.toString(), code: plain.account.code, name: plain.account.name, type: plain.account.type }
      : plain.account?.toString?.() ?? plain.account,
    debit: plain.debit,
    credit: plain.credit,
    party: plain.party,
    narration: plain.narration,
    date: plain.date,
  };
};

export const serializeJournalLineList = (lines) => lines.map(serializeJournalLine);
