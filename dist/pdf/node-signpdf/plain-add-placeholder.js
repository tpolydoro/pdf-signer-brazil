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
const const_1 = require("./const");
const pdf_creator_1 = require("./pdf-creator");
const pdf_kit_add_placeholder_1 = require("./pdf-kit-add-placeholder");
const pdf_kit_reference_mock_1 = __importDefault(require("./pdf-kit-reference-mock"));
const plainAddPlaceholder = (pdfBuffer, signatureOptions, signatureLength = const_1.DEFAULT_SIGNATURE_LENGTH) => __awaiter(void 0, void 0, void 0, function* () {
    const annotationOnPages = signatureOptions.annotationOnPages != null ? signatureOptions.annotationOnPages : [0];
    const pdfAppender = new pdf_creator_1.PdfCreator(pdfBuffer, annotationOnPages);
    const acroFormPosition = pdfAppender.pdf.lastIndexOf('/Type /AcroForm');
    const isAcroFormExists = acroFormPosition !== -1;
    let acroFormId;
    let fieldIds = [];
    if (isAcroFormExists) {
        const acroForm = getAcroForm(pdfAppender.pdf, acroFormPosition);
        acroFormId = getAcroFormId(acroForm);
        fieldIds = getFieldIds(acroForm);
    }
    const imageReference = yield pdf_kit_add_placeholder_1.appendImage(pdfAppender, signatureOptions);
    const signatureReference = pdf_kit_add_placeholder_1.appendSignature(pdfAppender, signatureOptions, signatureLength);
    const helveticaFontReference = pdf_kit_add_placeholder_1.appendFont(pdfAppender, 'Helvetica');
    const zapfDingbatsFontReference = pdf_kit_add_placeholder_1.appendFont(pdfAppender, 'ZapfDingbats');
    const widgetReferenceList = annotationOnPages.map((annotationPage, index) => {
        const annotationReference = pdf_kit_add_placeholder_1.appendAnnotationApparance(pdfAppender, signatureOptions, helveticaFontReference, imageReference);
        const widgetReference = pdf_kit_add_placeholder_1.appendWidget(pdfAppender, fieldIds.length > 0 ? fieldIds.length + index + 1 : index + 1, signatureOptions, signatureReference, annotationReference);
        return widgetReference;
    });
    const formReference = pdf_kit_add_placeholder_1.appendAcroform(pdfAppender, fieldIds, widgetReferenceList, [
        { name: 'Helvetica', ref: helveticaFontReference },
        { name: 'ZapfDingbats', ref: zapfDingbatsFontReference },
    ], acroFormId);
    pdfAppender.close(formReference, widgetReferenceList);
    return pdfAppender.pdf;
});
const getAcroForm = (pdfBuffer, acroFormPosition) => {
    const pdfSlice = pdfBuffer.slice(acroFormPosition - 12);
    const acroForm = pdfSlice.slice(0, pdfSlice.indexOf('endobj')).toString();
    return acroForm;
};
const getAcroFormId = (acroForm) => {
    const acroFormFirsRow = acroForm.split('\n')[0];
    const acroFormId = parseInt(acroFormFirsRow.split(' ')[0]);
    return acroFormId;
};
const getFieldIds = (acroForm) => {
    let fieldIds = [];
    const acroFormFields = acroForm.slice(acroForm.indexOf('/Fields [') + 9, acroForm.indexOf(']'));
    fieldIds = acroFormFields
        .split(' ')
        .filter((_element, index) => index % 3 === 0)
        .map((fieldId) => new pdf_kit_reference_mock_1.default(fieldId));
    return fieldIds;
};
exports.default = plainAddPlaceholder;
