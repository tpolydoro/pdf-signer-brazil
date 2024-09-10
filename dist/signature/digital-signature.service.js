"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_forge_1 = __importDefault(require("node-forge"));
const certUtil = __importStar(require("./cert.util"));
exports.getSignature = (pdfWithByteRange, p12Buffer, placeholderLength, certPassword) => {
    const p12Data = certUtil.getDataFromP12Cert(p12Buffer, certPassword);
    const certBags = certUtil.getCertBags(p12Data);
    const keyBags = getKeyBags(p12Data);
    const privateKey = getPrivateKey(keyBags);
    const p7 = node_forge_1.default.pkcs7.createSignedData();
    p7.content = node_forge_1.default.util.createBuffer(pdfWithByteRange.toString('binary'));
    const certificate = getCertificate(p7, certBags, privateKey);
    const signer = getSigner(privateKey, certificate);
    p7.addSigner(signer);
    p7.sign({ detached: true });
    const rawSignature = getRawSignature(p7, placeholderLength);
    let signature = exports.getSignatureFromRawSignature(rawSignature, placeholderLength);
    return signature;
};
exports.getOnlyRawSignature = (pdfWithByteRange, p12Buffer, placeholderLength, certPassword) => {
    const p12Data = certUtil.getDataFromP12Cert(p12Buffer, certPassword);
    const certBags = certUtil.getCertBags(p12Data);
    const keyBags = getKeyBags(p12Data);
    const privateKey = getPrivateKey(keyBags);
    const p7 = node_forge_1.default.pkcs7.createSignedData();
    p7.content = node_forge_1.default.util.createBuffer(pdfWithByteRange.toString('binary'));
    const certificate = getCertificate(p7, certBags, privateKey);
    const signer = getSigner(privateKey, certificate);
    p7.addSigner(signer);
    p7.sign({ detached: true });
    const rawSignature = getRawSignature(p7, placeholderLength);
    return rawSignature;
};
const getKeyBags = (p12) => {
    const keyBags = p12.getBags({ bagType: node_forge_1.default.pki.oids.pkcs8ShroudedKeyBag })[node_forge_1.default.pki.oids.pkcs8ShroudedKeyBag];
    if (!keyBags) {
        throw new Error('KeyBags are not exist!');
    }
    return keyBags;
};
const getPrivateKey = (keyBags) => {
    const privateKey = keyBags[0].key;
    if (!privateKey) {
        throw new Error('PrivateKey is not exists!');
    }
    return privateKey;
};
const getCertificate = (p7, certBags, privateKey) => {
    let certificate;
    Object.keys(certBags).forEach((value, index, array) => {
        var _a, _b;
        const publicKey = (_b = (_a = certBags[index]) === null || _a === void 0 ? void 0 : _a.cert) === null || _b === void 0 ? void 0 : _b.publicKey;
        const rawCertificate = certBags[index].cert;
        p7.addCertificate(rawCertificate);
        // Para evitar que ignore um certificado válido
        if (!certificate)
            certificate = getValidatedCertificate(privateKey, publicKey, rawCertificate);
    });
    if (!certificate) {
        throw new Error('Failed to find a certificate that matches the private key.');
    }
    return certificate;
};
const getRawSignature = (p7, placeholderLength) => {
    const rawSignature = node_forge_1.default.asn1.toDer(p7.toAsn1()).getBytes();
    if (rawSignature.length * 2 > placeholderLength) {
        throw new Error(`Signature exceeds placeholder length: ${rawSignature.length * 2} > ${placeholderLength}`);
    }
    return rawSignature;
};
exports.getSignatureFromRawSignature = (rawSignature, placeholderLength) => {
    let signature = Buffer.from(rawSignature, 'binary').toString('hex');
    signature += Buffer.from(String.fromCharCode(0).repeat(placeholderLength / 2 - rawSignature.length)).toString('hex');
    return signature;
};
const getSigner = (privateKey, certificate) => {
    return {
        key: privateKey,
        certificate,
        digestAlgorithm: node_forge_1.default.pki.oids.sha256
    };
};
const getValidatedCertificate = (privateKey, publicKey, rawCertificate) => {
    let validatedCertificate = undefined;
    const isPrivateKeyModulusSameAsPublicKeyModulus = privateKey.n.compareTo(publicKey.n) === 0;
    const isPrivateKeyExponentSameAsPublicKeyExponent = privateKey.e.compareTo(publicKey.e) === 0;
    if (isPrivateKeyModulusSameAsPublicKeyModulus && isPrivateKeyExponentSameAsPublicKeyExponent) {
        validatedCertificate = rawCertificate;
    }
    return validatedCertificate;
};
