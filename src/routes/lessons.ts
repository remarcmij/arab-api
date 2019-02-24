import express, { Request, Response } from 'express'
import * as content from '../content/content'

function getIndex(_: Request, res: Response) {
  content.getIndex().then((rows: any) => res.json(rows))
}

function getChapters(req: Request, res: Response) {
  content.getChapters(req.params.publication).then((rows: any) => res.json(rows))
}

function getDocument(req: Request, res: Response) {
  const { publication, article } = req.params
  content.getDocument(publication, article).then(
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
  .get('/:publication', getChapters)
  .get('/:publication/:article', getDocument)

export default router
