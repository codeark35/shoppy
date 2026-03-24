import { Injectable, OnModuleInit, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    if (admin.apps.length > 0) return; // ya inicializado (hot reload)

    const projectId = this.config.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.config.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.config
      .get<string>('FIREBASE_PRIVATE_KEY', '')
      .replace(/\\n/g, '\n'); // las claves en .env van con \n literales

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn(
        'Firebase Admin no configurado — las variables FIREBASE_PROJECT_ID, ' +
          'FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY son obligatorias para el login con Google.',
      );
      return;
    }

    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });

    this.logger.log(`Firebase Admin inicializado (proyecto: ${projectId})`);
  }

  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    if (admin.apps.length === 0) {
      throw new UnauthorizedException('Firebase no está configurado en el servidor');
    }
    try {
      return await admin.auth().verifyIdToken(idToken);
    } catch {
      throw new UnauthorizedException('Token de Google inválido o expirado');
    }
  }
}
