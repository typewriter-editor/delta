export { default as AttributeMap } from './AttributeMap.js';
export { default as Delta } from './Delta.js';
export { default as Op, OpIterator } from './Op.js';

import diff from 'fast-diff';
import cloneDeep from './util/cloneDeep.js';
import isEqual from './util/isEqual.js';

export { cloneDeep, diff, isEqual };
