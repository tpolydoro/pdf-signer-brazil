"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const get_index_from_ref_1 = __importDefault(require("./get-index-from-ref"));
const findObject = (pdf, refTable, ref) => {
    const index = get_index_from_ref_1.default(refTable, ref);
    const offset = refTable.offsets.get(index);
    let slice = pdf.slice(offset);
    slice = slice.slice(0, slice.indexOf('endobj'));
    slice = slice.slice(slice.indexOf('<<') + 2);
    slice = slice.slice(0, slice.lastIndexOf('>>'));
    return slice;
};
exports.default = findObject;
