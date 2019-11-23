import { RequestHandler } from 'express';

declare global {
  namespace Express {
    interface Request {
      clientLinkGenerator(link: string): string;
    }
  }
}

export const linkGeneratorTORequest: RequestHandler = (req, res, next) => {
  req.clientLinkGenerator = (link: string) =>
    process.env.NODE_ENV === 'production'
      ? `https://${req.headers.host}/${link.replace(/^\/+/, '')}`
      : `http://localhost:3000/${link.replace(/^\/+/, '')}`;
  next();
};
