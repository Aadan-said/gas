import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface LicenseConfig {
  isSuspended: boolean;
  suspendedReason: string;
  developerContact: string;
  graceWarning: string | null;
  suspendedUserIds: string[];
  updatedAt: string;
}

const DEFAULT_LICENSE: LicenseConfig = {
  isSuspended: false,
  suspendedReason: 'Khidmadda adeegga softweerka ee bishan ayaan la bixin. Fadlan la xiriir Software Engineer-ka si nidaamka dib loogu furo.',
  developerContact: 'Software Engineer: Aadan Said — Tel/WhatsApp: +252 090 6575473',
  graceWarning: null,
  suspendedUserIds: [],
  updatedAt: new Date().toISOString()
};

const IS_VERCEL = !!process.env.VERCEL;
const DATA_DIR = IS_VERCEL ? path.join('/tmp', 'gasflow_data') : path.join(process.cwd(), 'data');
const LICENSE_FILE = path.join(DATA_DIR, 'developer_license.json');

let inMemoryLicense: LicenseConfig | null = null;

function readLicense(): LicenseConfig {
  if (inMemoryLicense) return inMemoryLicense;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(LICENSE_FILE)) {
      const raw = fs.readFileSync(LICENSE_FILE, 'utf-8');
      inMemoryLicense = JSON.parse(raw);
      return inMemoryLicense!;
    }
  } catch (e) {
    console.error('[developer/license] Error reading license file:', e);
  }
  inMemoryLicense = { ...DEFAULT_LICENSE };
  return inMemoryLicense;
}

function writeLicense(lic: LicenseConfig): void {
  inMemoryLicense = lic;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LICENSE_FILE, JSON.stringify(lic, null, 2), 'utf-8');
  } catch (e) {
    console.error('[developer/license] Error writing license file:', e);
  }
}

// Master Passcodes known only to Developer (Engineer Aadan Said)
const MASTER_DEV_PINS = ['778899', 'aadan2026', 'aadan7788'];

export async function GET() {
  const license = { ...readLicense() };

  // 1. Direct Cloud Kill-Switch via Vercel Environment Variables
  if (process.env.GASFLOW_SUSPENDED === 'true' || process.env.NEXT_PUBLIC_GASFLOW_LOCKED === 'true') {
    license.isSuspended = true;
    if (process.env.GASFLOW_SUSPENDED_REASON) {
      license.suspendedReason = process.env.GASFLOW_SUSPENDED_REASON;
    }
  }

  if (process.env.GASFLOW_GRACE_WARNING) {
    license.graceWarning = process.env.GASFLOW_GRACE_WARNING;
  }

  // 2. Remote Master URL Heartbeat Check (if an external URL or GitHub raw JSON is provided)
  const remoteUrl = process.env.GASFLOW_REMOTE_LICENSE_URL;
  if (remoteUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(remoteUrl, { signal: controller.signal, cache: 'no-store' });
      clearTimeout(timeoutId);
      if (res.ok) {
        const remoteData = await res.json();
        if (remoteData && typeof remoteData.isSuspended === 'boolean') {
          license.isSuspended = remoteData.isSuspended;
          if (remoteData.suspendedReason) license.suspendedReason = remoteData.suspendedReason;
          if (remoteData.developerContact) license.developerContact = remoteData.developerContact;
          if (remoteData.graceWarning !== undefined) license.graceWarning = remoteData.graceWarning;
        }
      }
    } catch {
      // Failover safely to local state if offline or timeout
    }
  }

  return NextResponse.json({
    success: true,
    license
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      masterPin,
      isSuspended,
      suspendedReason,
      developerContact,
      graceWarning,
      suspendedUserIds
    } = body;

    const cleanPin = String(masterPin || '').trim();
    if (!MASTER_DEV_PINS.includes(cleanPin)) {
      return NextResponse.json(
        { success: false, error: 'Koodhka Master Developer PIN waa khalad! / Invalid Master Developer Key.' },
        { status: 401 }
      );
    }

    const current = readLicense();
    const updated: LicenseConfig = {
      isSuspended: typeof isSuspended === 'boolean' ? isSuspended : current.isSuspended,
      suspendedReason: suspendedReason || current.suspendedReason,
      developerContact: developerContact || current.developerContact,
      graceWarning: graceWarning !== undefined ? graceWarning : current.graceWarning,
      suspendedUserIds: Array.isArray(suspendedUserIds) ? suspendedUserIds : current.suspendedUserIds,
      updatedAt: new Date().toISOString()
    };

    writeLicense(updated);

    return NextResponse.json({
      success: true,
      message: updated.isSuspended
        ? 'Nidaamka si guul leh ayaa loo xanibay (System Locked by Developer).'
        : 'Nidaamka si guul leh ayaa loo furay (System Unlocked by Developer).',
      license: updated
    });
  } catch (e) {
    console.error('[developer/license] POST error:', e);
    return NextResponse.json({ success: false, error: 'Failed to update license status.' }, { status: 500 });
  }
}
