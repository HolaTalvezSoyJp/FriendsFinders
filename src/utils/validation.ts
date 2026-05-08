export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateLocationUpdate(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid message body' };
  }

  const msg = body as Record<string, unknown>;

  if (typeof msg.latitude !== 'number' || isNaN(msg.latitude) || !isFinite(msg.latitude)) {
    return { valid: false, error: 'latitude must be a finite number' };
  }
  if (typeof msg.longitude !== 'number' || isNaN(msg.longitude) || !isFinite(msg.longitude)) {
    return { valid: false, error: 'longitude must be a finite number' };
  }
  if (msg.latitude < -90 || msg.latitude > 90) {
    return { valid: false, error: 'latitude must be between -90 and 90' };
  }
  if (msg.longitude < -180 || msg.longitude > 180) {
    return { valid: false, error: 'longitude must be between -180 and 180' };
  }
  if (!msg.timestamp || typeof msg.timestamp !== 'string') {
    return { valid: false, error: 'timestamp is required and must be a string' };
  }

  return { valid: true };
}
