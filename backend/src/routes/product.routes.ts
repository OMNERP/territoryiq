// product.routes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { query } from '../config/database';

const router = Router();
router.use(authenticate);

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query(`SELECT * FROM products WHERE is_active=true ORDER BY name`);
    res.json({ products: rows });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, category, description, sku } = req.body;
    const { rows } = await query(
      `INSERT INTO products (name,category,description,sku) VALUES ($1,$2,$3,$4) RETURNING *`,
      [name, category||null, description||null, sku||null]
    );
    res.status(201).json({ product: rows[0] });
  } catch (err) { next(err); }
});

export default router;
