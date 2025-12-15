const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI Content Generation Platform API',
      version: '1.0.0',
      description: 'API documentation for AI-powered content generation platform. Generate stories, create videos with AI voiceover, and publish to TikTok and YouTube.',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:9999',
        description: 'Development server'
      },
      {
        url: 'https://ai-content-generation-82hi.onrender.com',
        description: 'Production server'
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication endpoints'
      },
      {
        name: 'Content',
        description: 'AI content generation endpoints'
      },
      {
        name: 'TikTok',
        description: 'TikTok sounds and trending content'
      },
      {
        name: 'Videos',
        description: 'Video creation and management'
      },
      {
        name: 'Media',
        description: 'Background videos and music'
      },
      {
        name: 'Accounts',
        description: 'Social media account connections'
      },
      {
        name: 'Publish',
        description: 'Publish videos to platforms'
      },
      {
        name: 'Health',
        description: 'Health check endpoints'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /auth/login or /auth/register'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            message: {
              type: 'string',
              description: 'Detailed error message'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'User ID'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email'
            }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: 'JWT authentication token'
            },
            user: {
              $ref: '#/components/schemas/User'
            }
          }
        },
        Content: {
          type: 'object',
          properties: {
            id: {
              type: 'integer'
            },
            user_id: {
              type: 'integer'
            },
            prompt: {
              type: 'string'
            },
            generated_text: {
              type: 'string'
            },
            status: {
              type: 'string',
              enum: ['pending', 'processing', 'completed', 'failed']
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        TikTokSound: {
          type: 'object',
          properties: {
            id: {
              type: 'string'
            },
            title: {
              type: 'string'
            },
            author: {
              type: 'string'
            },
            duration: {
              type: 'integer'
            },
            cover_url: {
              type: 'string',
              format: 'uri'
            },
            play_url: {
              type: 'string',
              format: 'uri'
            }
          }
        },
        VideoProgress: {
          type: 'object',
          properties: {
            message: {
              type: 'string'
            },
            percent: {
              type: 'integer',
              minimum: 0,
              maximum: 100
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js', './index.js'] 
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec
};
