const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MyAnilist API Documentation',
      version: '1.0.0',
      description: 'API documentation for MyAnilist - Anime tracking and list management system integrated with AniList API',
      contact: {
        name: 'API Support',
        email: 'support@myanilist.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.myanilist.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  example: 'NotFoundError'
                },
                message: {
                  type: 'string',
                  example: 'Resource not found'
                }
              }
            }
          }
        },
        ValidationError: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Validation failed'
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    example: 'params.anilistId'
                  },
                  message: {
                    type: 'string',
                    example: '"anilistId" must be a positive number'
                  }
                }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Anime',
        description: 'Anime management and information endpoints'
      },
      {
        name: 'Health',
        description: 'API health check endpoints'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/modules/**/*.routes.js',
    './src/modules/**/*.controller.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerUi, swaggerSpec };
