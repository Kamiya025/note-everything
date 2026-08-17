import { NextRequest } from 'next/server';
import { shareController } from '../../../server/controllers/shareController';

export async function POST(req: NextRequest) {
  return shareController.createSessionHandler(req);
}

export async function GET(req: NextRequest) {
  return shareController.getSessionHandler(req);
}

export async function PATCH(req: NextRequest) {
  return shareController.mergeSessionHandler(req);
}
