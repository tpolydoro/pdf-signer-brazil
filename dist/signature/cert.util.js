"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_forge_1 = __importDefault(require("node-forge"));
exports.getDataFromP12Cert = (p12Buffer, certPassword) => {
    const forgeCert = node_forge_1.default.util.createBuffer(p12Buffer.toString('binary'));
    const p12Asn1 = node_forge_1.default.asn1.fromDer(forgeCert);
    const p12data = node_forge_1.default.pkcs12.pkcs12FromAsn1(p12Asn1, false, certPassword);
    return p12data;
};
exports.getCertBags = (p12) => {
    const certBags = p12.getBags({ bagType: node_forge_1.default.pki.oids.certBag })[node_forge_1.default.pki.oids.certBag];
    if (!certBags) {
        throw new Error('CertBags are not exist!');
    }
    return certBags;
};
