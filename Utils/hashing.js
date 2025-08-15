import hash from "bcryptjs";
import crypto from "crypto";
 const hashData = async (data) => {
    const salt = await hash.genSalt(10);
    return await hash.hash(data, salt);
};

const compareData = async (data, hashedData) => {
    return await hash.compare(data, hashedData);
};

/**
 * Generate HMAC for request signing/data verification
 * (Not for passwords - use bcrypt for passwords)
 */
const generateHMAC = (data, secret) => {
    return crypto
        .createHmac('sha256', secret)
        .update(data)
        .digest('hex');
};
export default { hashData, compareData, generateHMAC };