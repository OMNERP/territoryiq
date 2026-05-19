// ── analytics.routes.ts ───────────────────────────────
import { Router as R } from 'express';
import { authenticate, territoryScope } from '../middleware/auth.middleware';
import {
  dashboard, coverageTrend, mrProductivity,
  territoryComparison, visitHeatmap, productPerformance
} from '../controllers/analytics.controller';

const analyticsRouter = R();
analyticsRouter.use(authenticate, territoryScope);
analyticsRouter.get('/dashboard',            dashboard);
analyticsRouter.get('/coverage/trend',       coverageTrend);
analyticsRouter.get('/mr-productivity',      mrProductivity);
analyticsRouter.get('/territory-comparison', territoryComparison);
analyticsRouter.get('/visit-heatmap',        visitHeatmap);
analyticsRouter.get('/product-performance',  productPerformance);
export { analyticsRouter as default };
