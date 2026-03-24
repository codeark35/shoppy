import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@libs/prisma';
import { FirebaseService } from '../firebase/firebase.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly firebase: FirebaseService,
  ) {}

  // ─── Registro ────────────────────────────────────────────────────────────────
  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Ya existe una cuenta con ese email');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        name: dto.name,
        phone: dto.phone,
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    const tokens = this.generateTokens(user.id, user.email, user.role);
    return { user, ...tokens };
  }

  // ─── Login ────────────────────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const tokens = this.generateTokens(user.id, user.email, user.role);
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, ...tokens };
  }

  // ─── Refresh ──────────────────────────────────────────────────────────────────
  async refresh(userId: string, email: string, role: string) {
    // Re-fetch desde BD para que el rol siempre sea el actual
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const tokens = this.generateTokens(user.id, user.email, user.role);
    return tokens;
  }

  // ─── Login con Google (Firebase) ───────────────────────────────────────────
  async loginWithGoogle(idToken: string) {
    const decoded = await this.firebase.verifyIdToken(idToken);

    const { uid: googleId, email, name: googleName, picture: avatarUrl } = decoded;

    if (!email) {
      throw new UnauthorizedException('La cuenta de Google no tiene email asociado');
    }

    // Buscar por googleId primero, luego por email (para vincular cuentas existentes)
    let user = await this.prisma.user.findFirst({
      where: { OR: [{ googleId }, { email: email.toLowerCase() }] },
    });

    if (user) {
      // Vincular googleId si llegó por email y aún no tiene googleId
      if (!user.googleId) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId, avatarUrl: avatarUrl ?? user.avatarUrl },
        });
      }
    } else {
      // Crear usuario nuevo
      user = await this.prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name: googleName ?? email.split('@')[0],
          googleId,
          avatarUrl,
        },
      });
    }

    const tokens = this.generateTokens(user.id, user.email, user.role);
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, ...tokens };
  }

  // ─── Obtener perfil ───────────────────────────────────────────────────────────
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  // ─── Helpers internos ─────────────────────────────────────────────────────────
  private generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    return { accessToken, refreshToken };
  }
}
