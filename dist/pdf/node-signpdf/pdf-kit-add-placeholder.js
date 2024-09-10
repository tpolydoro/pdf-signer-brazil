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
Object.defineProperty(exports, "__esModule", { value: true });
const appender_1 = require("../image/appender");
const const_1 = require("./const");
const specialCharacters = [
    'á',
    'Á',
    'é',
    'É',
    'í',
    'Í',
    'ó',
    'Ó',
    'ö',
    'Ö',
    'ő',
    'Ő',
    'ú',
    'Ú',
    'ű',
    'Ű',
];
exports.appendFont = (pdf, fontName) => {
    const fontObject = getFont(fontName);
    const fontReference = pdf.append(fontObject);
    return fontReference;
};
exports.appendAcroform = (pdf, fieldIds, widgetReferenceList, fonts, acroFormId) => {
    /*
    const fontObject = getFont('Helvetica')
    const fontReference = pdf.append(fontObject)
  
    const zafObject = getFont('ZapfDingbats')
    const zafReference = pdf.append(zafObject)
  */
    const acroformObject = getAcroform(fieldIds, widgetReferenceList, fonts);
    const acroformReference = pdf.append(acroformObject, acroFormId);
    return acroformReference;
};
exports.appendImage = (pdf, signatureOptions) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const hasImg = (_b = (_a = signatureOptions.annotationAppearanceOptions) === null || _a === void 0 ? void 0 : _a.imageDetails) === null || _b === void 0 ? void 0 : _b.imagePath;
    const IMG = hasImg
        ? yield appender_1.getImage(signatureOptions.annotationAppearanceOptions.imageDetails.imagePath, pdf)
        : undefined;
    return IMG;
});
exports.appendAnnotationApparance = (pdf, signatureOptions, apFontReference, image) => {
    const apObject = getAnnotationApparance(image, apFontReference);
    const apReference = pdf.appendStream(apObject, getStream(signatureOptions.annotationAppearanceOptions, image != null ? image.index : undefined));
    return apReference;
};
exports.appendWidget = (pdf, widgetIndex, signatureOptions, signatureReference, apReference) => {
    const widgetObject = getWidget(widgetIndex, signatureReference, apReference, signatureOptions.annotationAppearanceOptions.signatureCoordinates, pdf);
    const widgetReference = pdf.append(widgetObject);
    return widgetReference;
};
exports.appendSignature = (pdf, signatureOptions, signatureLength = const_1.DEFAULT_SIGNATURE_LENGTH, byteRangePlaceholder = const_1.DEFAULT_BYTE_RANGE_PLACEHOLDER) => {
    const signatureObject = getSignature(byteRangePlaceholder, signatureLength, signatureOptions.reason, signatureOptions);
    const signatureReference = pdf.append(signatureObject);
    return signatureReference;
};
const getAcroform = (fieldIds, WIDGET, fonts) => {
    const mergedFonts = fonts.reduce((prev, curr) => prev + `/${curr.name} ${curr.ref.toString()} `, '');
    return {
        Type: 'AcroForm',
        SigFlags: 3,
        Fields: [...fieldIds, ...WIDGET],
        DR: `<</Font\n<<${mergedFonts.trim()}>>\n>>`,
    };
};
const getWidget = (widgetIndex, signature, AP, signatureCoordinates, pdf) => {
    const signatureBaseName = 'Signature';
    return {
        Type: 'Annot',
        Subtype: 'Widget',
        FT: 'Sig',
        Rect: [
            signatureCoordinates.left,
            signatureCoordinates.bottom,
            signatureCoordinates.right,
            signatureCoordinates.top,
        ],
        V: signature,
        T: new String(signatureBaseName + widgetIndex),
        F: 4,
        AP: `<</N ${AP.index} 0 R>>`,
        P: pdf.getCurrentWidgetPageReference(),
        DA: new String('/Helvetica 0 Tf 0 g'),
    };
};
const getAnnotationApparance = (IMG, APFONT) => {
    let resources = `<</Font <<\n/f1 ${APFONT.index} 0 R\n>>>>`;
    if (IMG != null) {
        resources = `<</XObject <<\n/Img${IMG.index} ${IMG.index} 0 R\n>>\n/Font <<\n/f1 ${APFONT.index} 0 R\n>>\n>>`;
    }
    let xObject = {
        CropBox: [0, 0, 197, 70],
        Type: 'XObject',
        FormType: 1,
        BBox: [-10, 10, 197.0, 70.0],
        MediaBox: [0, 0, 197, 70],
        Subtype: 'Form',
        Resources: resources,
    };
    return xObject;
};
const getStream = (annotationAppearanceOptions, imgIndex) => {
    const generatedContent = generateSignatureContents(annotationAppearanceOptions.signatureDetails);
    let generatedImage = '';
    if (imgIndex != null) {
        generatedImage = generateImage(annotationAppearanceOptions.imageDetails, imgIndex);
    }
    return getConvertedText(`
    1.0 1.0 1.0 rg
    0.0 0.0 0.0 RG
    q
    ${generatedImage}
    0 0 0 rg
    ${generatedContent}
    Q`);
};
const generateImage = (imageDetails, imgIndex) => {
    const { rotate, space, stretch, tilt, xPos, yPos } = imageDetails.transformOptions;
    return `
    q
    ${space} ${rotate} ${tilt} ${stretch} ${xPos} ${yPos} cm
    /Img${imgIndex} Do
    Q
  `;
};
const generateSignatureContents = (details) => {
    const detailsAsPdfContent = details.map((detail, index) => {
        const detailAsPdfContent = generateSignatureContent(detail);
        return detailAsPdfContent;
    });
    return detailsAsPdfContent.join('');
};
const generateSignatureContent = (detail) => {
    const { rotate, space, tilt, xPos, yPos } = detail.transformOptions;
    return `
    BT
    0 Tr
    /f1 ${detail.fontSize} Tf
    ${space} ${rotate} ${tilt} 1 ${xPos} ${yPos} Tm
    (${detail.value}) Tj
    ET
  `;
};
const getFont = (baseFont) => {
    return {
        Type: 'Font',
        BaseFont: baseFont,
        Encoding: 'WinAnsiEncoding',
        Subtype: 'Type1',
    };
};
const getSignature = (byteRangePlaceholder, signatureLength, reason, signatureDetails) => {
    return {
        Type: 'Sig',
        Filter: 'Adobe.PPKLite',
        SubFilter: 'adbe.pkcs7.detached',
        ByteRange: [0, byteRangePlaceholder, byteRangePlaceholder, byteRangePlaceholder],
        Contents: Buffer.from(String.fromCharCode(0).repeat(signatureLength)),
        Reason: new String(reason),
        M: new Date(),
        ContactInfo: new String(`${signatureDetails.email}`),
        Name: new String(`${signatureDetails.signerName}`),
        Location: new String(`${signatureDetails.location}`),
    };
};
const getConvertedText = (text) => {
    return text
        .split('')
        .map((character) => {
        return specialCharacters.includes(character)
            ? getOctalCodeFromCharacter(character)
            : character;
    })
        .join('');
};
const getOctalCodeFromCharacter = (character) => {
    return '\\' + character.charCodeAt(0).toString(8);
};
