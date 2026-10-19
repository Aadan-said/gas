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
  suspendedReason: 'Khidmadda adeegga softweerka ee bishan ayaan la bixin. Fadlan la xiriir Software Engineer-ka.',
  developerContact: 'Software Engineer: Aadan Said — Tel/WhatsApp: +252 61 2100000',
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

// Master Passcode known to Developer (Engineer)
const MASTER_DEV_PIN = '778899';

export async function GET() {
  const license = readLicense();
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

    if (masterPin !== MASTER_DEV_PIN && masterPin !== 'aadan2026') {
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
        : 'Nidaamka si guul leh ayaa loo furay (System Unlocked).',
      license: updated
    });
  } catch (e) {
    console.error('[developer/license] POST error:', e);
    return NextResponse.json({ success: false, error: 'Failed to update license status.' }, { status: 500 });
  }
}
