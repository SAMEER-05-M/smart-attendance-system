import { prisma } from '../prisma.js';

export async function logAuditEvent(params: {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, any> | string;
  ipAddress?: string;
}) {
  try {
    const detailsStr = typeof params.details === 'object'
      ? JSON.stringify(params.details)
      : params.details;

    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        details: detailsStr,
        ipAddress: params.ipAddress,
      },
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}
