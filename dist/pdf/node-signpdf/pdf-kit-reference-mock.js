"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const abstract_reference_1 = __importDefault(require("./pdfkit/abstract_reference"));
class PDFKitReferenceMock extends abstract_reference_1.default {
    constructor(index, additionalData = undefined) {
        super();
        this.index = index;
        if (typeof additionalData !== 'undefined') {
            Object.assign(this, additionalData);
        }
    }
    toString() {
        return `${this.index} 0 R`;
    }
}
exports.default = PDFKitReferenceMock;
