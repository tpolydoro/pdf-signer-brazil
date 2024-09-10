"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const abstract_reference_1 = __importDefault(require("../node-signpdf/pdfkit/abstract_reference"));
const primitiveStringHandler = {
    convert(object) {
        return `/${object}`;
    },
    isTypeMatches(object) {
        return typeof object === 'string';
    },
};
const stringHandler = {
    convert(object, encryptFunction) {
        const escapable = {
            '\n': '\\n',
            '\r': '\\r',
            '\t': '\\t',
            '\b': '\\b',
            '\f': '\\f',
            '\\': '\\\\',
            '(': '\\(',
            ')': '\\)',
        };
        const swapBytes = (buff) => {
            const bufferLength = buff.length;
            if (bufferLength & 0x01) {
                throw new Error('Buffer length must be even');
            }
            else {
                for (let i = 0, end = bufferLength - 1; i < end; i += 2) {
                    const a = buff[i];
                    buff[i] = buff[i + 1];
                    buff[i + 1] = a;
                }
            }
            return buff;
        };
        let string = object;
        let isUnicode = false;
        for (let i = 0, end = string.length; i < end; i += 1) {
            if (string.charCodeAt(i) > 0x7f) {
                isUnicode = true;
                break;
            }
        }
        let stringBuffer;
        if (isUnicode) {
            stringBuffer = swapBytes(Buffer.from(`\ufeff${string}`, 'utf16le'));
        }
        else {
            stringBuffer = Buffer.from(string, 'ascii');
        }
        if (encryptFunction) {
            string = encryptFunction(stringBuffer).toString('binary');
        }
        else {
            string = stringBuffer.toString('binary');
        }
        string = string.replace((escapableRe, c) => escapable[c]);
        return `(${string})`;
    },
    isTypeMatches(object) {
        return object instanceof String;
    },
};
const bufferHandler = {
    convert(object) {
        return `<${object.toString('hex')}>`;
    },
    isTypeMatches(object) {
        return Buffer.isBuffer(object);
    },
};
const PDFAbstrastReferenceHandler = {
    convert(object) {
        return object.toString();
    },
    isTypeMatches(object) {
        return object instanceof abstract_reference_1.default;
    },
};
const dateHandler = {
    convert(object, encryptFunction) {
        const escapableRe = /[\n\r\t\b\f\(\)\\]/g;
        const escapable = {
            '\n': '\\n',
            '\r': '\\r',
            '\t': '\\t',
            '\b': '\\b',
            '\f': '\\f',
            '\\': '\\\\',
            '(': '\\(',
            ')': '\\)',
        };
        const pad = (str, length) => (Array(length + 1).join('0') + str).slice(-length);
        let string = `D:${pad(object.getUTCFullYear(), 4)}${pad(object.getUTCMonth() + 1, 2)}${pad(object.getUTCDate(), 2)}${pad(object.getUTCHours(), 2)}${pad(object.getUTCMinutes(), 2)}${pad(object.getUTCSeconds(), 2)}Z`;
        if (encryptFunction) {
            string = encryptFunction(Buffer.from(string, 'ascii')).toString('binary');
            string = string.replace(escapableRe, (c) => escapable[c]);
        }
        return `(${string})`;
    },
    isTypeMatches(object) {
        return object instanceof Date;
    },
};
const arrayHandler = {
    convert(object, encryptFunction) {
        const items = object.map((e) => exports.convertObject(e, encryptFunction)).join(' ');
        return `[${items}]`;
    },
    isTypeMatches(object) {
        return Array.isArray(object);
    },
};
const objectHandler = {
    convert(object, encryptFunction) {
        const out = ['<<'];
        for (const key in object) {
            if (object.hasOwnProperty(key)) {
                let val = object[key];
                let checkedValue = '';
                if (val != null && val.toString().indexOf('<<') !== -1) {
                    checkedValue = val;
                }
                else {
                    checkedValue = exports.convertObject(val, encryptFunction);
                }
                out.push(`/${key} ${checkedValue}`);
            }
        }
        out.push('>>');
        return out.join('\n');
    },
    isTypeMatches(object) {
        return {}.toString.call(object) === '[object Object]';
    },
};
const numberHandler = {
    convert(object) {
        let result;
        if (object > -1e21 && object < 1e21) {
            result = Math.round(object * 1e6) / 1e6;
        }
        else {
            throw new Error(`unsupported number: ${object}`);
        }
        return String(result);
    },
    isTypeMatches(object) {
        return typeof object === 'number';
    },
};
const defaultHandler = {
    convert(object) {
        return `${object}`;
    },
    isTypeMatches(object) {
        throw new Error(`Default handle doesnt have isMyType method`);
    },
};
const converters = [
    primitiveStringHandler,
    stringHandler,
    bufferHandler,
    PDFAbstrastReferenceHandler,
    dateHandler,
    arrayHandler,
    numberHandler,
    objectHandler,
];
exports.convertObject = (object, encryptFunction = null) => {
    const selectedConverter = converters.find((converter) => converter.isTypeMatches(object));
    const converter = selectedConverter != null ? selectedConverter.convert : defaultHandler.convert;
    return converter(object, encryptFunction);
};
