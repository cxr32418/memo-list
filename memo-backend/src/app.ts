import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { ZodError } from 'zod';
import { authenticateToken, getUserByToken, loginUser, logout, registerUser } from './auth-service.js';
import {
  completeTask,
  createTask,
  deleteTask,
  getTaskById,
  listTasks,
  updateTask,
} from './task-service.js';
import { NotFoundError, ValidationError } from './errors.js';
import {
  completeTaskSchema,
  createTaskSchema,
  loginSchema,
  listTaskQuerySchema,
  registerSchema,
  updateTaskSchema,
} from './validation.js';

export const app = express();

app.use(cors());
app.use(express.json());

interface AuthenticatedRequest extends Request {
  authUserId?: string;
  authToken?: string;
}

app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const payload = registerSchema.parse(req.body);
    const result = await registerUser(payload);
    res.status(201).json(result);
  } catch (error) {
    handleError(error, res);
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await loginUser(payload);
    res.json(result);
  } catch (error) {
    handleError(error, res);
  }
});

app.get('/api/auth/me', async (req: Request, res: Response) => {
  try {
    const token = extractToken(req);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const user = await getUserByToken(token);
    res.json({ user });
  } catch {
    res.status(401).json({ error: 'Unauthorized.' });
  }
});

app.post('/api/auth/logout', async (req: Request, res: Response) => {
  const token = extractToken(req);
  if (!token) {
    res.json({ ok: true });
    return;
  }

  await logout(token);
  res.json({ ok: true });
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'memo-backend' });
});

app.use('/api/tasks', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const user = await authenticateToken(token);
    req.authUserId = user.id;
    req.authToken = token;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized.' });
  }
});

app.get('/api/tasks', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = listTaskQuerySchema.parse(req.query);
    const tasks = await listTasks({
      userId: req.authUserId as string,
      date: parsed.date,
      from: parsed.from,
      to: parsed.to,
      includeCompleted: parsed.includeCompleted,
    });
    res.json({ tasks });
  } catch (error) {
    handleError(error, res);
  }
});

app.post('/api/tasks', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const payload = createTaskSchema.parse(req.body);
    const task = await createTask(req.authUserId as string, payload);
    res.status(201).json({ task });
  } catch (error) {
    handleError(error, res);
  }
});

app.get('/api/tasks/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const task = await getTaskById(req.authUserId as string, req.params.id);
    res.json({ task });
  } catch (error) {
    handleError(error, res);
  }
});

app.patch('/api/tasks/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const payload = updateTaskSchema.parse(req.body);
    const task = await updateTask(req.authUserId as string, req.params.id, payload);
    res.json({ task });
  } catch (error) {
    handleError(error, res);
  }
});

app.delete('/api/tasks/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await deleteTask(req.authUserId as string, req.params.id);
    res.json({ ok: true });
  } catch (error) {
    handleError(error, res);
  }
});

app.post('/api/tasks/:id/complete', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const payload = completeTaskSchema.parse(req.body);
    const result = await completeTask(req.authUserId as string, req.params.id, payload);
    res.json(result);
  } catch (error) {
    handleError(error, res);
  }
});

function extractToken(req: Request): string | null {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.slice('Bearer '.length).trim();
  return token || null;
}

function handleError(error: unknown, res: Response): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'Invalid request payload.',
      details: error.issues,
    });
    return;
  }

  if (error instanceof ValidationError) {
    if (error.message === 'Unauthorized.') {
      res.status(401).json({ error: error.message });
      return;
    }

    res.status(400).json({ error: error.message });
    return;
  }

  if (error instanceof NotFoundError) {
    res.status(404).json({ error: error.message });
    return;
  }

  res.status(500).json({ error: 'Internal server error.' });
}
