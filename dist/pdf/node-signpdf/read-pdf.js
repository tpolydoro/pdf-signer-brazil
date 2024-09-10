"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const find_object_1 = __importDefault(require("./find-object"));
const readPdf = (pdf) => {
    const trailerStart = pdf.lastIndexOf('trailer');
    const trailer = pdf.slice(trailerStart, pdf.length - 6);
    let rawXRefPosition = trailer.slice(trailer.lastIndexOf('startxref') + 10).toString();
    const xRefPosition = parseInt(rawXRefPosition);
    const refTable = readRefTable(pdf);
    let rootSlice = trailer.slice(trailer.indexOf('/Root'));
    rootSlice = rootSlice.slice(0, rootSlice.indexOf('/', 1));
    const rootRef = rootSlice
        .slice(6)
        .toString()
        .trim(); // /Root + at least one space
    const root = find_object_1.default(pdf, refTable, rootRef).toString();
    if (refTable.maxOffset > xRefPosition) {
        throw new Error('Ref table is not at the end of the document. This document can only be signed in incremental mode.');
    }
    return {
        xref: refTable,
        rootRef,
        root,
        trailerStart,
        previousXrefs: [],
        xRefPosition,
    };
};
const readRefTable = (pdf) => {
    const offsetsMap = new Map();
    const fullXrefTable = getFullXrefTable(pdf);
    const startingIndex = 0;
    let maxOffset = 0;
    const maxIndex = Object.keys(fullXrefTable).length - 1;
    Object.keys(fullXrefTable).forEach(id => {
        const offset = parseInt(fullXrefTable[id]);
        maxOffset = Math.max(maxOffset, offset);
        offsetsMap.set(parseInt(id), offset);
    });
    return {
        maxOffset,
        startingIndex,
        maxIndex,
        offsets: offsetsMap,
    };
};
const getFullXrefTable = (pdf) => {
    const lastTrailerPosition = getLastTrailerPosition(pdf);
    const lastXrefTable = getXref(pdf, lastTrailerPosition);
    if (lastXrefTable.prev === undefined) {
        return lastXrefTable.xRefContent;
    }
    const pdfWithoutLastTrailer = pdf.slice(0, lastTrailerPosition);
    const partOfXrefTable = getFullXrefTable(pdfWithoutLastTrailer);
    const mergedXrefTable = Object.assign(Object.assign({}, partOfXrefTable), lastXrefTable.xRefContent);
    return mergedXrefTable;
};
const getLastTrailerPosition = (pdf) => {
    const trailerStart = pdf.lastIndexOf('trailer');
    const trailer = pdf.slice(trailerStart, pdf.length - 6);
    const xRefPosition = trailer.slice(trailer.lastIndexOf('startxref') + 10).toString();
    return parseInt(xRefPosition);
};
const getXref = (pdf, position) => {
    let refTable = pdf.slice(position);
    refTable = refTable.slice(4);
    refTable = refTable.slice(refTable.indexOf('\n') + 1);
    const size = refTable.toString().split('/Size')[1];
    const [objects, infos] = refTable.toString().split('trailer');
    const isContainingPrev = infos.split('/Prev')[1] != null;
    let prev;
    let xRefContent;
    if (isContainingPrev) {
        const pagesRefRegex = new RegExp('Prev (\\d+)', 'g');
        const match = pagesRefRegex.exec(infos);
        if (match == null) {
            throw new Error('Cant find value for this regexp Pattern');
        }
        prev = match[1];
        xRefContent = objects
            .split('\n')
            .filter((l) => l !== '')
            .reduce(parseTrailerXref, {});
    }
    else {
        xRefContent = objects
            .split('\n')
            .filter((l) => l !== '')
            .reduce(parseRootXref, {});
    }
    return {
        size,
        prev,
        xRefContent,
    };
};
const parseRootXref = (prev, l, i) => {
    const element = l.split(' ')[0];
    const isPageObject = parseInt(element) === 0 && element.length > 3;
    if (isPageObject) {
        return Object.assign(Object.assign({}, prev), { 0: 0 });
    }
    let [offset] = l.split(' ');
    return Object.assign(Object.assign({}, prev), { [i - 1]: parseInt(offset) });
};
const parseTrailerXref = (prev, curr, _index, array) => {
    if (array.length === 1) {
        return {};
    }
    const isObjectId = curr.split(' ').length === 2;
    if (isObjectId) {
        const [id] = curr.split(' ');
        return Object.assign(Object.assign({}, prev), { [id]: undefined });
    }
    const [offset] = curr.split(' ');
    const prevId = Object.keys(prev).find(id => prev[id] === undefined);
    if (prevId === undefined) {
        return prev;
    }
    return Object.assign(Object.assign({}, prev), { [prevId]: parseInt(offset) });
};
exports.default = readPdf;
