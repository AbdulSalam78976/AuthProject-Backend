
import joi from "joi";

const loginValidator = joi.object({
    email: joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org'] } })
        .required()
        .messages({
            'string.empty': 'Email is required',
            'string.email': 'Please enter a valid email address',
            'any.required': 'Email is required'
        }),
    password: joi.string()
        .required()
        .messages({
            'string.empty': 'Password is required',
            
        })
});

export default loginValidator;