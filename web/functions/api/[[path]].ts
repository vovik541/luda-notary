// Pages Functions entry for every /api/* path; the logic lives in api/handler.ts.
// Pages runs Functions only for the routes in this folder, so static pages never invoke it.
import { type Env, handleApi } from '../../api/handler';

export const onRequest: PagesFunction<Env> = ({ request, env }) => handleApi(request, env);
