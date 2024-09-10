"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const const_1 = require("./const");
const remove_trailing_new_line_1 = __importDefault(require("./remove-trailing-new-line"));
exports.addSignatureToPdf = (pdf, sigContentsPosition, signature) => {
    pdf = Buffer.concat([
        pdf.slice(0, sigContentsPosition),
        Buffer.from(`<${signature}>`),
        pdf.slice(sigContentsPosition),
    ]);
    return pdf;
};
exports.replaceByteRangeInPdf = (pdfBuffer) => {
    if (!(pdfBuffer instanceof Buffer)) {
        throw new Error('PDF expected as Buffer.');
    }
    let pdf = remove_trailing_new_line_1.default(pdfBuffer);
    const byteRangePlaceholder = [
        0,
        `/${const_1.DEFAULT_BYTE_RANGE_PLACEHOLDER}`,
        `/${const_1.DEFAULT_BYTE_RANGE_PLACEHOLDER}`,
        `/${const_1.DEFAULT_BYTE_RANGE_PLACEHOLDER}`,
    ];
    const byteRangeString = `/ByteRange [${byteRangePlaceholder.join(' ')}]`;
    const byteRangePos = pdf.indexOf(byteRangeString);
    if (byteRangePos === -1) {
        throw new Error(`Could not find ByteRange placeholder: ${byteRangeString}`);
    }
    const byteRangeEnd = byteRangePos + byteRangeString.length;
    const contentsTagPos = pdf.indexOf('/Contents ', byteRangeEnd);
    const placeholderPos = pdf.indexOf('<', contentsTagPos);
    const placeholderEnd = pdf.indexOf('>', placeholderPos);
    const placeholderLengthWithBrackets = placeholderEnd + 1 - placeholderPos;
    const placeholderLength = placeholderLengthWithBrackets - 2;
    const byteRange = getByteRange(placeholderPos, placeholderLengthWithBrackets, pdf.length);
    let actualByteRange = `/ByteRange [${byteRange.join(' ')}]`;
    actualByteRange += ' '.repeat(byteRangeString.length - actualByteRange.length);
    pdf = Buffer.concat([
        pdf.slice(0, byteRangePos),
        Buffer.from(actualByteRange),
        pdf.slice(byteRangeEnd),
    ]);
    pdf = Buffer.concat([
        pdf.slice(0, byteRange[1]),
        pdf.slice(byteRange[2], byteRange[2] + byteRange[3]),
    ]);
    return { pdf, placeholderLength, byteRange };
};
const getByteRange = (placeholderPos, placeholderLengthWithBrackets, pdfLength) => {
    const byteRange = [0, 0, 0, 0];
    byteRange[1] = placeholderPos;
    byteRange[2] = byteRange[1] + placeholderLengthWithBrackets;
    byteRange[3] = pdfLength - byteRange[2];
    return byteRange;
};
