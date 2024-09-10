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
const png_js_1 = __importDefault(require("png-js"));
const zlib_1 = __importDefault(require("zlib"));
exports.getPngImage = (pdf, data) => __awaiter(void 0, void 0, void 0, function* () {
    const image = new png_js_1.default(data);
    const hasAlphaChannel = image.hasAlphaChannel;
    const pngBaseData = {
        Type: 'XObject',
        Subtype: 'Image',
        BitsPerComponent: hasAlphaChannel ? 8 : image.bits,
        Width: image.width,
        Height: image.height,
        Filter: 'FlateDecode',
    };
    if (!hasAlphaChannel) {
        const params = pdf.append({
            Predictor: 15,
            Colors: image.colors,
            BitsPerComponent: image.bits,
            Columns: image.width,
        });
        pngBaseData['DecodeParms'] = params;
    }
    if (image.palette.length === 0) {
        pngBaseData['ColorSpace'] = image.colorSpace;
    }
    else {
        const palette = pdf.append({
            stream: new Buffer(image.palette),
        });
        pngBaseData['ColorSpace'] = ['Indexed', 'DeviceRGB', image.palette.length / 3 - 1, palette];
    }
    if (image.transparency.grayscale != null) {
        const val = image.transparency.grayscale;
        pngBaseData['Mask'] = [val, val];
    }
    else if (image.transparency.rgb) {
        const { rgb } = image.transparency;
        const mask = [];
        for (let x of rgb) {
            mask.push(x, x);
        }
        pngBaseData['Mask'] = mask;
    }
    else if (image.transparency.indexed) {
        const indexedAlphaChannel = yield getIndexedAlphaChannel(image);
        image.alphaChannel = indexedAlphaChannel;
    }
    else if (hasAlphaChannel) {
        const { imgData, alphaChannel } = yield getSplittedAlphaChannelAndImageData(image);
        image.imgData = imgData;
        image.alphaChannel = alphaChannel;
        const sMask = getSmask(pdf, image, alphaChannel);
        pngBaseData['Mask'] = sMask;
    }
    const pngImage = pdf.appendStream(pngBaseData, image.imgData);
    return pngImage;
});
const getIndexedAlphaChannel = (image) => __awaiter(void 0, void 0, void 0, function* () {
    const transparency = image.transparency.indexed;
    const alpaChannelPromise = new Promise((resolve, reject) => {
        image.decodePixels((pixels) => {
            const alphaChannel = new Buffer(image.width * image.height);
            let i = 0;
            for (let j = 0, end = pixels.length; j < end; j++) {
                alphaChannel[i++] = transparency[pixels[j]];
            }
            resolve(zlib_1.default.deflateSync(alphaChannel));
        });
    });
    return alpaChannelPromise;
});
const getSplittedAlphaChannelAndImageData = (image) => __awaiter(void 0, void 0, void 0, function* () {
    const alpaChannelAndImageDataPromise = new Promise((resolve, reject) => {
        image.decodePixels((pixels) => {
            let a, p;
            const colorCount = image.colors;
            const pixelCount = image.width * image.height;
            const imgData = new Buffer(pixelCount * colorCount);
            const alphaChannel = new Buffer(pixelCount);
            let i = (p = a = 0);
            const len = pixels.length;
            const skipByteCount = image.bits === 16 ? 1 : 0;
            while (i < len) {
                for (let colorIndex = 0; colorIndex < colorCount; colorIndex++) {
                    imgData[p++] = pixels[i++];
                    i += skipByteCount;
                }
                alphaChannel[a++] = pixels[i++];
                i += skipByteCount;
            }
            resolve({ imgData: zlib_1.default.deflateSync(imgData), alphaChannel: zlib_1.default.deflateSync(alphaChannel) });
        });
    });
    return alpaChannelAndImageDataPromise;
});
const getSmask = (pdf, image, alphaChannel) => {
    let sMask;
    if (image.hasAlphaChannel) {
        sMask = pdf.append({
            Type: 'XObject',
            Subtype: 'Image',
            Height: image.height,
            Width: image.width,
            BitsPerComponent: 8,
            Filter: 'FlateDecode',
            ColorSpace: 'DeviceGray',
            Decode: [0, 1],
            stream: alphaChannel,
        });
    }
    return sMask;
};
