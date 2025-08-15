import hash from "bcryptjs";
 const hashPassword = async (password) => {
    const salt = await hash.genSalt(10);
    return await hash.hash(password, salt);
};

const comparePassword = async (password, hashedPassword) => {
    return await hash.compare(password, hashedPassword);
};
export default {hashPassword, comparePassword};