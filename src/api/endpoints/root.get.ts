
import * as db from '../db';
import { isAuthorized } from '../../models/User';
import { Request, Response } from 'express'

export const getRoot = (req: Request, res: Response) => {
  db.getIndexTopics()
    .then(topics =>
      topics.filter(topic => !topic.restricted || isAuthorized(req.user)),
    )
    .then(topics => res.json(topics));

}