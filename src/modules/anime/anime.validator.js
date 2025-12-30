const Joi = require('joi');

/**
 * Validator for anime-related endpoints.
 */
const getAnimeDetailsSchema = Joi.object({
    params: Joi.object({
        anilistId: Joi.number().integer().positive().required()
            .messages({
                'number.base': '"anilistId" must be a number',
                'number.integer': '"anilistId" must be an integer',
                'number.positive': '"anilistId" must be a positive number',
                'any.required': '"anilistId" is a required parameter'
            }).required()
    }).required()
});

/**
 * Middleware validate request
 */
const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(
            {
                params: req.params,
                query: req.query,
                body: req.body
            },
            {
                abortEarly: false,
                stripUnknown: true
            }
        );
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                error: 'Validation failed',
                details: errors
            });
        }

        next();
    };
};

module.exports = {
    getAnimeDetailsValidator: validateRequest(getAnimeDetailsSchema)
};