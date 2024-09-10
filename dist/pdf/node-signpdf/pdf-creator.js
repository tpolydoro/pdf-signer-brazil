"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pdf_object_1 = require("../pdf-object-converter/pdf-object");
const create_buffer_page_with_annotation_1 = __importDefault(require("./create-buffer-page-with-annotation"));
const create_buffer_root_with_acrofrom_1 = __importDefault(require("./create-buffer-root-with-acrofrom"));
const create_buffer_trailer_1 = __importDefault(require("./create-buffer-trailer"));
const get_index_from_ref_1 = __importDefault(require("./get-index-from-ref"));
const get_page_ref_1 = __importDefault(require("./get-page-ref"));
const pdf_kit_reference_mock_1 = __importDefault(require("./pdf-kit-reference-mock"));
const read_pdf_1 = __importDefault(require("./read-pdf"));
const remove_trailing_new_line_1 = __importDefault(require("./remove-trailing-new-line"));
class PdfCreator {
    constructor(originalPdf, annotationOnPages) {
        this.addedReferences = new Map();
        this.annotationOnPages = [];
        this.pdf = remove_trailing_new_line_1.default(originalPdf);
        this.originalPdf = originalPdf;
        this.maxIndex = read_pdf_1.default(this.pdf).xref.maxIndex;
        if (annotationOnPages == null) {
            this.initAnnotationInfos(0);
            this.widgetCounter = 0;
        }
        else {
            annotationOnPages.forEach((annotationOnPage) => {
                this.initAnnotationInfos(annotationOnPage);
            });
            this.widgetCounter = annotationOnPages.length - 1;
        }
    }
    initAnnotationInfos(annotationOnPage) {
        const info = read_pdf_1.default(this.pdf);
        const pageRef = get_page_ref_1.default(this.pdf, info, annotationOnPage);
        const pageIndex = get_index_from_ref_1.default(info.xref, pageRef);
        this.annotationOnPages = [
            ...this.annotationOnPages,
            {
                pageIndex: annotationOnPage,
                pageRef: new pdf_kit_reference_mock_1.default(pageIndex, {
                    data: {
                        Annots: [],
                    },
                }),
            },
        ];
    }
    getCurrentWidgetPageReference() {
        const currentPageReference = this.annotationOnPages[this.widgetCounter];
        this.widgetCounter -= 1;
        return currentPageReference.pageRef;
    }
    append(pdfElement, additionalIndex) {
        this.maxIndex += 1;
        const index = additionalIndex != null ? additionalIndex : this.maxIndex;
        this.addedReferences.set(index, this.pdf.length + 1);
        this.appendPdfObject(index, pdfElement);
        return new pdf_kit_reference_mock_1.default(this.maxIndex);
    }
    appendStream(pdfElement, stream, additionalIndex) {
        this.maxIndex += 1;
        const index = additionalIndex != null ? additionalIndex : this.maxIndex;
        this.addedReferences.set(index, this.pdf.length + 1);
        this.appendPdfObjectWithStream(index, pdfElement, stream);
        return new pdf_kit_reference_mock_1.default(this.maxIndex);
    }
    close(form, widgetReferenceList) {
        const info = read_pdf_1.default(this.pdf);
        if (!this.isContainBufferRootWithAcrofrom(this.originalPdf)) {
            const rootIndex = get_index_from_ref_1.default(info.xref, info.rootRef);
            this.addedReferences.set(rootIndex, this.pdf.length + 1);
            this.pdf = Buffer.concat([
                this.pdf,
                Buffer.from('\n'),
                create_buffer_root_with_acrofrom_1.default(info, form),
            ]);
        }
        this.annotationOnPages.forEach((annotationOnPage, index) => {
            const { pageRef } = annotationOnPage;
            this.addedReferences.set(pageRef.index, this.pdf.length + 1);
            this.pdf = Buffer.concat([
                this.pdf,
                Buffer.from('\n'),
                create_buffer_page_with_annotation_1.default(this.pdf, info, pageRef.toString(), widgetReferenceList[index]),
            ]);
        });
        this.pdf = Buffer.concat([
            this.pdf,
            Buffer.from('\n'),
            create_buffer_trailer_1.default(this.pdf, info, this.addedReferences),
        ]);
    }
    appendPdfObjectWithStream(index, pdfObject, stream) {
        this.pdf = Buffer.concat([
            this.pdf,
            Buffer.from('\n'),
            Buffer.from(`${index} 0 obj\n`),
            Buffer.from(pdf_object_1.convertObject(pdfObject)),
            Buffer.from('\nstream\n'),
            Buffer.from(stream),
            Buffer.from('\nendstream'),
            Buffer.from('\nendobj\n'),
        ]);
    }
    appendPdfObject(index, pdfObject) {
        this.pdf = Buffer.concat([
            this.pdf,
            Buffer.from('\n'),
            Buffer.from(`${index} 0 obj\n`),
            Buffer.from(pdf_object_1.convertObject(pdfObject)),
            Buffer.from('\nendobj\n'),
        ]);
    }
    isContainBufferRootWithAcrofrom(pdf) {
        const bufferRootWithAcroformRefRegex = new RegExp('\\/AcroForm\\s+(\\d+\\s\\d+\\sR)', 'g');
        const match = bufferRootWithAcroformRefRegex.exec(pdf.toString());
        return match != null && match[1] != null && match[1] !== '';
    }
}
exports.PdfCreator = PdfCreator;
