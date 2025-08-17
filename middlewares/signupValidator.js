import joi from "joi";

/**
 * Route-level validation (Joi)
 * - Validates incoming requests BEFORE they reach the database
 * - Provides user-friendly error messages
 * - Acts as the first line of defense
 */



const signUpValidator = joi.object({
  name: joi.string()
    .min(2)
    .max(30)
    .required()
    .messages({
      'string.empty': 'Name is required',
      
      'string.max': 'Name should not exceed 20 characters',
      'any.required': 'Name is required'
    }),

  email: joi.string()
    .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org'] } })
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required'
    }),

  password: joi.string()
  .min(8)
  .max(30)
  .pattern(/^[a-zA-Z0-9]+$/)  // Removed RegExp constructor and quotes
  .required()
  .messages({
    'string.empty': 'Password is required',
    'string.min': 'Password should have at least {#limit} characters',
    'string.max': 'Password should not exceed {#limit} characters',
    'string.pattern.base': 'Password must contain only letters and numbers',
    'any.required': 'Password is required'
  })
});

const acceptCodeSchema = joi.object({
  email: joi.string()
    .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org'] } })
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required'
    }),
  verificationCode: joi.string()
    .required()
    .messages({
      'string.empty': 'Verification code is required',
      'any.required': 'Verification code is required'
    })
});


const changePasswordSchema=joi.object({
  oldPassword: joi.string()
    .required()
    .messages({
      'string.empty': 'Old password is required',
      'any.required': 'Old password is required'
    }),
  newPassword: joi.string()
    .min(8)
    .max(30)
    .pattern(/^[a-zA-Z0-9]+$/)  // Removed RegExp constructor and quotes
    .required()
    .messages({
      'string.empty': 'New password is required',
      'string.min': 'New password should have at least {#limit} characters',
      'string.max': 'New password should not exceed {#limit} characters',
      'string.pattern.base': 'New password must contain only letters and numbers',
      'any.required': 'New password is required'
    })
});

export { signUpValidator, acceptCodeSchema, changePasswordSchema };