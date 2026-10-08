import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CompanyDocumentType } from '@prisma/client';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

type UploadedFileData = {
  originalname: string;
  buffer: Buffer;
  size: number;
};

// Private folder: it is NOT served publicly. Files can only leave through the guarded API.
const STORAGE_DIR = path.join(process.cwd(), 'storage', 'company-documents');
const MAX_DOCUMENTS_PER_COMPANY = 20;

const ALLOWED_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
};

// Checks the first bytes of the file, so a renamed .txt or .exe is rejected
function hasValidSignature(buf: Buffer, ext: string): boolean {
  if (ext === 'pdf') {
    return buf.subarray(0, 4).toString('latin1') === '%PDF';
  }
  if (ext === 'png') {
    return buf.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  }
  if (ext === 'jpg' || ext === 'jpeg') {
    return buf.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  }
  return false;
}

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  private async getProfile(userId: string) {
    const profile = await this.prisma.employerProfile.findUnique({
      where: { userId },
      select: { id: true, verificationStatus: true },
    });
    if (!profile) {
      throw new NotFoundException('Employer profile not found');
    }
    return profile;
  }

  async upload(userId: string, typeRaw: string, file?: UploadedFileData) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const validTypes = Object.values(CompanyDocumentType) as string[];
    if (!validTypes.includes(typeRaw)) {
      throw new BadRequestException('Invalid document type');
    }

    const profile = await this.getProfile(userId);

    const count = await this.prisma.companyDocument.count({
      where: { employerProfileId: profile.id },
    });
    if (count >= MAX_DOCUMENTS_PER_COMPANY) {
      throw new BadRequestException(
        `Document limit reached (${MAX_DOCUMENTS_PER_COMPANY})`,
      );
    }

    const ext = path.extname(file.originalname).slice(1).toLowerCase();
    if (!ALLOWED_TYPES[ext]) {
      throw new BadRequestException('Only PDF, JPG or PNG files are allowed');
    }
    if (!hasValidSignature(file.buffer, ext)) {
      throw new BadRequestException(
        'File content does not match its type. Upload a real PDF, JPG or PNG.',
      );
    }

    const storedName = `${randomUUID()}.${ext}`;
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    await fs.writeFile(path.join(STORAGE_DIR, storedName), file.buffer);

    const doc = await this.prisma.companyDocument.create({
      data: {
        employerProfileId: profile.id,
        type: typeRaw as CompanyDocumentType,
        originalName: file.originalname,
        storedName,
        mimeType: ALLOWED_TYPES[ext],
        size: file.size,
      },
      select: {
        id: true,
        type: true,
        originalName: true,
        mimeType: true,
        size: true,
        createdAt: true,
      },
    });

    return doc;
  }

  async list(userId: string) {
    const profile = await this.getProfile(userId);
    return this.prisma.companyDocument.findMany({
      where: { employerProfileId: profile.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        originalName: true,
        mimeType: true,
        size: true,
        createdAt: true,
      },
    });
  }

  async getFile(userId: string, documentId: string) {
    const profile = await this.getProfile(userId);
    const doc = await this.prisma.companyDocument.findFirst({
      where: { id: documentId, employerProfileId: profile.id },
    });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    const filePath = path.join(STORAGE_DIR, doc.storedName);
    try {
      await fs.access(filePath);
    } catch {
      throw new NotFoundException('File is missing on the server');
    }

    return { doc, filePath };
  }

  async remove(userId: string, documentId: string) {
    const profile = await this.getProfile(userId);
    if (profile.verificationStatus === 'APPROVED') {
      throw new ForbiddenException(
        'Documents cannot be deleted after the company is approved',
      );
    }

    const doc = await this.prisma.companyDocument.findFirst({
      where: { id: documentId, employerProfileId: profile.id },
    });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    await this.prisma.companyDocument.delete({ where: { id: doc.id } });
    try {
      await fs.unlink(path.join(STORAGE_DIR, doc.storedName));
    } catch {
      // file was already gone, nothing else to do
    }

    return { deleted: true };
  }
}