import { Router, type RequestHandler } from 'express';
import { HttpError } from '../errors.ts';
import type { ComplaintStore } from '../store.ts';
import { validateAddComplaint, validateStatusUpdate } from '../validation.ts';

/** 415 unless the request declares a JSON body. */
const requireJson: RequestHandler = (req, _res, next) => {
  const type = req.headers['content-type'] ?? '';
  if (!type.toLowerCase().startsWith('application/json')) {
    throw new HttpError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json.');
  }
  next();
};

function notFound(id: string): HttpError {
  return new HttpError(404, 'COMPLAINT_NOT_FOUND', `Complaint with ID ${id} not found.`);
}

export function complaintsRouter(store: ComplaintStore): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    res.status(200).json({ data: store.list() });
  });

  router.post('/', requireJson, async (req, res) => {
    const input = validateAddComplaint(req.body);
    const created = await store.create(input);
    res.status(201).location(`/api/complaints/${encodeURIComponent(created.id)}`).json({ data: created });
  });

  router.patch('/:id', requireJson, async (req, res) => {
    const id = String(req.params.id);
    const status = validateStatusUpdate(req.body);
    const updated = await store.updateStatus(id, status);
    if (!updated) throw notFound(id);
    res.status(200).json({ data: updated });
  });

  router.post('/:id/upvote', async (req, res) => {
    const id = String(req.params.id);
    const updated = await store.upvote(id);
    if (!updated) throw notFound(id);
    res.status(200).json({ data: updated });
  });

  return router;
}
