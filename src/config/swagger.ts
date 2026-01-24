import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MyAnilist API Documentation',
      version: '1.0.0',
      description: 'API documentation for MyAnilist',
      contact: {
        name: 'API Support',
        email: 'support@myanilist.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.myanilist.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  example: 'NotFoundError',
                },
                message: {
                  type: 'string',
                  example: 'Resource not found',
                },
              },
            },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Validation failed',
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    example: 'params.anilistId',
                  },
                  message: {
                    type: 'string',
                    example: '"anilistId" must be a positive number',
                  },
                },
              },
            },
          },
        },
        PageInfo: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              example: 100,
            },
            currentPage: {
              type: 'integer',
              example: 1,
            },
            lastPage: {
              type: 'integer',
              example: 10,
            },
            hasNextPage: {
              type: 'boolean',
              example: true,
            },
            perPage: {
              type: 'integer',
              example: 25,
            },
          },
        },
        AnimeResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                idAnilist: {
                  type: 'integer',
                  example: 1,
                },
                malId: {
                  type: 'integer',
                  nullable: true,
                  example: 1,
                },
                title: {
                  type: 'object',
                  properties: {
                    romaji: {
                      type: 'string',
                      example: 'Cowboy Bebop',
                    },
                    english: {
                      type: 'string',
                      nullable: true,
                      example: 'Cowboy Bebop',
                    },
                    native: {
                      type: 'string',
                      nullable: true,
                      example: 'カウボーイビバップ',
                    },
                  },
                },
                coverImage: {
                  type: 'string',
                  nullable: true,
                },
                bannerImage: {
                  type: 'string',
                  nullable: true,
                },
                type: {
                  type: 'string',
                  example: 'ANIME',
                },
                status: {
                  type: 'string',
                  example: 'FINISHED',
                },
                isAdult: {
                  type: 'boolean',
                  example: false,
                },
                score: {
                  type: 'number',
                  nullable: true,
                  example: 8.6,
                },
                meanScore: {
                  type: 'number',
                  nullable: true,
                  example: 8.6,
                },
                description: {
                  type: 'string',
                  nullable: true,
                },
                genres: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  nullable: true,
                },
                episodes: {
                  type: 'integer',
                  nullable: true,
                  example: 26,
                },
                duration: {
                  type: 'integer',
                  nullable: true,
                  example: 24,
                },
                season: {
                  type: 'string',
                  nullable: true,
                  example: 'SPRING',
                },
                seasonYear: {
                  type: 'integer',
                  nullable: true,
                  example: 1998,
                },
              },
            },
          },
        },
      },
      responses: {
        ValidationError: {
          description: 'Invalid request parameters',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationError',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: {
                  name: 'NotFoundError',
                  message: 'Anime not found',
                },
              },
            },
          },
        },
        ServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: {
                  name: 'InternalServerError',
                  message: 'An unexpected error occurred',
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Anime',
        description: 'Anime management and information endpoints',
      },
      {
        name: 'Health',
        description: 'API health check endpoints',
      },
    ],
  },
  apis: [
    './src/routes/*.js',
    './src/routes/*.ts',
    './src/modules/**/*.routes.js',
    './src/modules/**/*.routes.ts',
    './src/modules/**/*.controller.js',
    './src/modules/**/*.controller.ts',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerSpec, swaggerUi };
