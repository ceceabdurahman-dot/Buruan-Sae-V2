import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';

type HttpErrorFactory = (message?: string) => Error & { statusCode: number };

function makeHttpError(statusCode: number, name: string): HttpErrorFactory {
  return (message = name) => {
    const error = new Error(message) as Error & { statusCode: number };
    error.name = name;
    error.statusCode = statusCode;
    return error;
  };
}

declare module 'fastify' {
  interface FastifyInstance {
    httpErrors: {
      badRequest: HttpErrorFactory;
      unauthorized: HttpErrorFactory;
      forbidden: HttpErrorFactory;
      notFound: HttpErrorFactory;
      conflict: HttpErrorFactory;
      internalServerError: HttpErrorFactory;
    };
  }
}

export const httpErrorsPlugin = fp(async (app: FastifyInstance) => {
  app.decorate('httpErrors', {
    badRequest: makeHttpError(400, 'Bad Request'),
    unauthorized: makeHttpError(401, 'Unauthorized'),
    forbidden: makeHttpError(403, 'Forbidden'),
    notFound: makeHttpError(404, 'Not Found'),
    conflict: makeHttpError(409, 'Conflict'),
    internalServerError: makeHttpError(500, 'Internal Server Error'),
  });
});
