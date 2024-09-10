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
const fs_1 = __importDefault(require("fs"));
const jpeg_appender_1 = require("./jpeg-appender");
const png_appender_1 = require("./png-appender");
exports.getImage = (imagePath, pdf) => __awaiter(void 0, void 0, void 0, function* () {
    let img;
    const data = fs_1.default.readFileSync(imagePath);
    if (data[0] === 0xff && data[1] === 0xd8) {
        img = jpeg_appender_1.getJpgImage(pdf, data);
    }
    else if (data[0] === 0x89 && data.toString('ascii', 1, 4) === 'PNG') {
        img = yield png_appender_1.getPngImage(pdf, data);
    }
    else {
        throw new Error('Unknown image format.');
    }
    return img;
});
