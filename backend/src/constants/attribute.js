export const ATTRIBUTE_TYPES = Object.freeze({
  TEXT: 'text',
  NUMBER: 'number',
  SELECT: 'select',
  MULTISELECT: 'multiselect',
  BOOLEAN: 'boolean',
  DATE: 'date',
  COLOR: 'color',
  IMAGE: 'image',
});


export const VALUE_BACKED_ATTRIBUTE_TYPES = [
  ATTRIBUTE_TYPES.SELECT,
  ATTRIBUTE_TYPES.MULTISELECT,
  ATTRIBUTE_TYPES.COLOR,
  ATTRIBUTE_TYPES.IMAGE,
];
