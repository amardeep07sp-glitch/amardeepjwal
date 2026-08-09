// Flattens a category tree into an indented, ordered list suitable for a
// parent-select dropdown - excluding a given category and its whole subtree
// (a category can never become its own descendant's child).
export function flattenTreeForParentOptions(tree, excludeId) {
  const options = [];

  const visit = (nodes, depth) => {
    for (const node of nodes) {
      if (node.id === excludeId) continue;
      options.push({ id: node.id, name: node.name, depth });
      if (node.children?.length) visit(node.children, depth + 1);
    }
  };

  visit(tree, 0);
  return options;
}
