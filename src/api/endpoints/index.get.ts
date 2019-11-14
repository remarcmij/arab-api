import * as db from '../db';
import { Request, Response } from 'express';
import { isAuthorized } from '../../models/User';

export const getIndex = (req: Request, res: Response) => {
  db.getArticleTopics(req.params.publication)
    .then(topics =>
      topics.filter(topic => !topic.restricted || isAuthorized(req.user)),
    )
    .then(topics => res.json(topics));
};
