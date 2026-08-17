import { NextRequest } from 'next/server';
import { noteController } from '../../../server/controllers/noteController';

export async function GET(request: NextRequest) {
  return noteController.getNotesHandler(request);
}

export async function POST(request: Request) {
  return noteController.createNoteHandler(request);
}
