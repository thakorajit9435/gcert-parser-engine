'use strict';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) {k2 = k;}
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) {k2 = k;}
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, 'default', { enumerable: true, value: v });
}) : function(o, v) {
    o.default = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) {return mod;}
    var result = {};
    if (mod != null) {for (var k in mod) {if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k)) {__createBinding(result, mod, k);}}}
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { 'default': mod };
};
Object.defineProperty(exports, '__esModule', { value: true });
exports.verifySignature = exports.getRazorpayClient = void 0;
const razorpay_1 = __importDefault(require('razorpay'));
const functions = __importStar(require('firebase-functions'));
const crypto = __importStar(require('crypto'));
const getRazorpayConfig = () => {
    const key_id = functions.config().razorpay?.key_id || process.env.RAZORPAY_KEY_ID;
    const key_secret = functions.config().razorpay?.key_secret || process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) {
        throw new Error('Razorpay API keys are not configured in Firebase environment.');
    }
    return { key_id, key_secret };
};
const getRazorpayClient = () => {
    const { key_id, key_secret } = getRazorpayConfig();
    return new razorpay_1.default({
        key_id,
        key_secret,
    });
};
exports.getRazorpayClient = getRazorpayClient;
const verifySignature = (orderId, paymentId, signature) => {
    const { key_secret } = getRazorpayConfig();
    const hmac = crypto.createHmac('sha256', key_secret);
    hmac.update(orderId + '|' + paymentId);
    const generatedSignature = hmac.digest('hex');
    return generatedSignature === signature;
};
exports.verifySignature = verifySignature;
//# sourceMappingURL=razorpay.js.map
