"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const plain_add_placeholder_1 = __importDefault(require("./pdf/node-signpdf/plain-add-placeholder"));
const sign_1 = require("./pdf/node-signpdf/sign");
const digital_signature_service_1 = require("./signature/digital-signature.service");
exports.sign = (pdf, certBuffer, certPassword, signatureOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const pdfWithPlaceholder = yield plain_add_placeholder_1.default(pdf, signatureOptions);
    const { pdf: pdfWithActualByteRange, placeholderLength, byteRange } = sign_1.replaceByteRangeInPdf(pdfWithPlaceholder);
    const signature = digital_signature_service_1.getSignature(pdfWithActualByteRange, certBuffer, placeholderLength, certPassword);
    const signedPdf = sign_1.addSignatureToPdf(pdfWithActualByteRange, byteRange[1], signature);
    return signedPdf;
});
