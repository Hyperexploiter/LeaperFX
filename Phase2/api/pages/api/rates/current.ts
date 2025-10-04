/**
 * Current Exchange Rates API Endpoint
 * Alias for get.ts - retrieves current exchange rates for frontend applications
 */

import { NextApiRequest, NextApiResponse } from 'next';
import handler from './get';

// Simple forwarding to the get endpoint
export default handler;