"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const removeTrailingNewLine = (pdf) => {
    if (!(pdf instanceof Buffer)) {
        throw new Error('PDF expected as Buffer.');
    }
    const lastChar = pdf.slice(pdf.length - 1).toString();
    let output = pdf;
    if (lastChar === '\n') {
        output = pdf.slice(0, pdf.length - 1);
    }
    const lastLine = output.slice(output.length - 6).toString();
    if (lastLine !== '\n%%EOF') {
        output = Buffer.concat([output, Buffer.from('\n%%EOF')]);
    }
    return output;
};
exports.default = removeTrailingNewLine;
