import Razorpay from 'razorpay';
import * as functions from 'firebase-functions';
import * as crypto from 'crypto';

/**
 * Razorpay client initialized with keys from Firebase config or environment.
 * You must set these using:
 * firebase functions:config:set razorpay.key_id="YOUR_KEY_ID" razorpay.key_secret="YOUR_KEY_SECRET"
 */
const getRazorpayConfig = () => {
    const key_id = functions.config().razorpay?.key_id || process.env.RAZORPAY_KEY_ID;
    const key_secret = functions.config().razorpay?.key_secret || process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
        throw new Error('Razorpay API keys are not configured in Firebase environment.');
    }

    return { key_id, key_secret };
};

export const getRazorpayClient = () => {
    const { key_id, key_secret } = getRazorpayConfig();
    return new Razorpay({
        key_id,
        key_secret,
    });
};

export const verifySignature = (
    orderId: string,
    paymentId: string,
    signature: string
): boolean => {
    const { key_secret } = getRazorpayConfig();
    const hmac = crypto.createHmac('sha256', key_secret);
    hmac.update(orderId + '|' + paymentId);
    const generatedSignature = hmac.digest('hex');
    return generatedSignature === signature;
};
