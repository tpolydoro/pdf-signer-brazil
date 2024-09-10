"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const find_object_1 = __importDefault(require("./find-object"));
const get_pages_dictionary_ref_1 = __importDefault(require("./get-pages-dictionary-ref"));
const getPageRef = (pdf, info, annotationOnPage = 0) => {
    const pagesRef = get_pages_dictionary_ref_1.default(info);
    const pagesDictionary = find_object_1.default(pdf, info.xref, pagesRef);
    const kidsPosition = pagesDictionary.indexOf('/Kids');
    const kidsStart = pagesDictionary.indexOf('[', kidsPosition) + 1;
    const kidsEnd = pagesDictionary.indexOf(']', kidsPosition);
    const pages = pagesDictionary.slice(kidsStart, kidsEnd).toString();
    const pageIndexList = pages.split('0 R').filter((p) => p !== '');
    return `${pageIndexList[annotationOnPage]} 0 R`.trim();
};
exports.default = getPageRef;
