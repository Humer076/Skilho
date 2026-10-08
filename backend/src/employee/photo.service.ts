import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

// Private folder: never served directly. Photos only leave through guarded API routes.
export const PHOTO_DIR = path.join(process.cwd(), 'storage', 'employee-photos');

const ALLOWED: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
};

type UploadedFileData = {
  originalname: string;
  buffer: Buffer;
  size: number;
};

// Checks the first bytes of the file, so a renamed .txt or .exe is rejected
function hasValidSignature(buf: Buffer, ext: string): boolean {
  if (ext === 'png') {
    return buf.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  }
  if (ext === 'jpg' || ext === 'jpeg') {
    return buf.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  }
  return false;
}

@Injectable()
export class PhotoService {
  constructor(private prisma: PrismaService) {}

  async upload(userId: string, file?: UploadedFileData) {
    if (!file) {
      throw new BadRequestException('Photo is required');
    }

    const ext = path.extname(file.originalname).slice(1).toLowerCase();
    if (!ALLOWED[ext]) {
      throw new BadRequestException('Only JPG or PNG photos are allowed');
    }
    if (!hasValidSignature(file.buffer, ext)) {
      throw new BadRequestException(
        'File content does not match its type. Upload a real JPG or PNG photo.',
      );
    }

    const profile = await this.prisma.employeeProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
      select: { id: true, photoStoredName: true },
    });

    const storedName = `${randomUUID()}.${ext === 'jpeg' ? 'jpg' : ext}`;
    await fs.mkdir(PHOTO_DIR, { recursive: true });
    await fs.writeFile(path.join(PHOTO_DIR, storedName), file.buffer);

    await this.prisma.employeeProfile.update({
      where: { id: profile.id },
      data: { photoStoredName: storedName, photoMimeType: ALLOWED[ext] },
    });

    // The old photo is removed so unused files do not pile up
    if (profile.photoStoredName) {
      try {
        await fs.unlink(path.join(PHOTO_DIR, profile.photoStoredName));
      } catch {
        // already gone
      }
    }

    return { hasPhoto: true };
  }

  async getOwn(userId: string) {
    const profile = await this.prisma.employeeProfile.findUnique({
      where: { userId },
      select: { photoStoredName: true, photoMimeType: true },
    });
    if (!profile?.photoStoredName || !profile.photoMimeType) {
      throw new NotFoundException('No photo uploaded');
    }

    const filePath = path.join(PHOTO_DIR, profile.photoStoredName);
    try {
      await fs.access(filePath);
    } catch {
      throw new NotFoundException('Photo is missing on the server');
    }

    return { filePath, mimeType: profile.photoMimeType };
  }

  async remove(userId: string) {
    const profile = await this.prisma.employeeProfile.findUnique({
      where: { userId },
      select: { id: true, photoStoredName: true },
    });
    if (!profile?.photoStoredName) {
      throw new NotFoundException('No photo uploaded');
    }

    await this.prisma.employeeProfile.update({
      where: { id: profile.id },
      data: { photoStoredName: null, photoMimeType: null },
    });

    try {
      await fs.unlink(path.join(PHOTO_DIR, profile.photoStoredName));
    } catch {
      // already gone
    }

    return { deleted: true };
  }
}