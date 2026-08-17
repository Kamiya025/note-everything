import { telegramController } from '../../../server/controllers/telegramController';

export async function POST(request: Request) {
  return telegramController.notificationHandler(request);
}
