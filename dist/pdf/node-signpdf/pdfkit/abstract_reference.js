"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class PDFAbstractReference {
    toString() {
        throw new Error('Must be implemented by subclasses');
    }
}
exports.default = PDFAbstractReference;
