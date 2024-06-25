export { default as AttributeMap } from './AttributeMap';
export { default as Delta } from './Delta';
export { default as Op, OpIterator } from './Op';

import diff from 'fast-diff';
import cloneDeep from './util/cloneDeep';
import isEqual from './util/isEqual';

export { cloneDeep, diff, isEqual };
