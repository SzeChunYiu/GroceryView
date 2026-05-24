import { HttpStatus, type INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';

type OperationObject = {
  responses?: Record<string, { description?: string; content?: Record<string, { schema?: { $ref: string } }> }>; 
};

type PathItemObject = Record<string, OperationObject>;

const STANDARD_ERROR_SCHEMA_NAME = 'StandardApiErrorResponse';

const STANDARD_ERROR_RESPONSE = {
  description: 'Standardized GroceryView API error format',
  content: {
    'application/json': {
      schema: {
        $ref: `#/components/schemas/${STANDARD_ERROR_SCHEMA_NAME}`
      }
    }
  }
};

const STANDARD_ERROR_STATUSES = [
  HttpStatus.BAD_REQUEST,
  HttpStatus.UNAUTHORIZED,
  HttpStatus.FORBIDDEN,
  HttpStatus.NOT_FOUND,
  HttpStatus.UNPROCESSABLE_ENTITY,
  HttpStatus.CONFLICT,
  HttpStatus.INTERNAL_SERVER_ERROR
];

const STANDARD_ERROR_SCHEMA = {
  type: 'object',
  required: ['error'],
  properties: {
    error: {
      type: 'object',
      required: ['code', 'message'],
      properties: {
        code: {
          type: 'string',
          description: 'Machine-readable status code, aligned with Nest HTTP status names.',
          example: 'NOT_FOUND'
        },
        message: {
          type: 'string',
          description: 'Human-readable error message.',
          example: 'Store not found.'
        },
        details: {
          description: 'Optional structured details about the error.',
          nullable: true
        }
      }
    }
  }
};

function withStandardErrorSchema(document: OpenAPIObject): OpenAPIObject {
  const schemaBucket = document.components?.schemas ?? {};
  document.components = {
    ...document.components,
    schemas: {
      ...schemaBucket,
      [STANDARD_ERROR_SCHEMA_NAME]: STANDARD_ERROR_SCHEMA
    }
  };

  return document;
}

function withGlobalErrorResponses(document: OpenAPIObject): OpenAPIObject {
  const paths = document.paths ?? {};

  for (const pathItem of Object.values(paths) as PathItemObject[]) {
    for (const operation of Object.values(pathItem)) {
      if (!operation.responses) {
        operation.responses = {};
      }

      for (const status of STANDARD_ERROR_STATUSES) {
        const key = String(status);
        if (!operation.responses[key]) {
          operation.responses[key] = STANDARD_ERROR_RESPONSE;
        }
      }
    }
  }

  return document;
}

export function createApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('GroceryView API')
    .setDescription(
      'HTTP API for GroceryView products, stores, prices, users, watchlists, baskets, and alerts.'
    )
    .setVersion('0.1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  return withGlobalErrorResponses(withStandardErrorSchema(document));
}
