import { visitorController } from '../../../server/controllers/visitorController';

export async function GET() {
  return visitorController.getVisitorHandler();
}

export async function POST() {
  return visitorController.incrementVisitorHandler();
}
