"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getIndexFromRef = (refTable, ref) => {
    const [rawIndex] = ref.split(' ');
    const index = parseInt(rawIndex);
    if (!refTable.offsets.has(index)) {
        throw new Error(`Failed to locate object "${ref}".`);
    }
    return index;
};
exports.default = getIndexFromRef;
