import express, { Request, Response } from 'express'
import * as db from '../content/database'

function getIndex(_: Request, res: Response) {
  db.getIndex().then((rows: any) => res.json(rows))
}

function getChapters(req: Request, res: Response) {
  db.getChapters(req.params.publication).then((rows: any) => res.json(rows))
}

function getDocument(req: Request, res: Response) {
  const { filename } = req.params
  db.getDocument(filename).then(
    (doc: any): void => {
      if (!doc) {
        return void res.sendStatus(404)
      }
      res.json(doc)
    },
  )
}

const router = express.Router()

router
  .get('/', getIndex)
  .get('/index/:publication', getChapters)
  .get('/article/:filename', getDocument)

export default router
