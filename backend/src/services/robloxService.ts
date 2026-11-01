import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { RobloxConfig, RobloxUploadResult } from '../types/index.js';

const ROBLOX_ASSETS_API = 'https://apis.roblox.com/assets/v1/assets';
const ROBLOX_OPERATIONS_API = 'https://apis.roblox.com/assets/v1';

export async function validateRobloxCredentials({ apiKey, creatorId, creatorType = 'user' }: RobloxConfig): Promise<{ isValid: boolean; reason: string }> {
  if (!apiKey || !apiKey.trim()) {
    return { isValid: false, reason: 'Roblox API Key wajib diisi.' };
  }
  if (!creatorId || !creatorId.trim()) {
    return { isValid: false, reason: 'Creator ID (User ID atau Group ID) wajib diisi.' };
  }

  const cleanKey = apiKey.trim();
  const cleanId = creatorId.trim();

  try {
    const creatorParam = creatorType === 'group' 
      ? `creator.groupId=${cleanId}`
      : `creator.userId=${cleanId}`;

    const testUrl = `https://apis.roblox.com/assets/v1/assets?${creatorParam}&maxPageSize=1`;
    const res = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'x-api-key': cleanKey
      }
    });

    if (res.status === 401 || res.status === 403) {
      return { 
        isValid: false, 
        reason: 'API Key tidak valid atau tidak memiliki izin Assets:Read / Assets:Write di Roblox Open Cloud.' 
      };
    }

    if (res.status === 400) {
      const body = await res.json().catch(() => ({})) as any;
      return {
        isValid: false,
        reason: body.message || 'Format Creator ID atau parameter tidak valid di Roblox.'
      };
    }

    return { isValid: true, reason: 'Koneksi ke Roblox Open Cloud berhasil!' };
  } catch (err: any) {
    return { isValid: false, reason: `Gagal menghubungi server Roblox: ${err.message}` };
  }
}

export interface UploadAssetParams {
  filePath: string;
  displayName: string;
  description?: string;
  apiKey: string;
  creatorId: string;
  creatorType?: 'user' | 'group';
  durationSec?: number;
}

export async function uploadAudioAsset({ filePath, displayName, description = '', apiKey, creatorId, creatorType = 'user', durationSec }: UploadAssetParams): Promise<RobloxUploadResult> {
  if (durationSec && durationSec > 420) {
    throw new Error('Durasi audio melebihi batas maksimum 7 menit untuk Roblox Open Cloud.');
  }

  if (!fsSync.existsSync(filePath)) {
    throw new Error(`File audio tidak ditemukan di path: ${filePath}`);
  }

  const cleanKey = (apiKey || '').trim();
  const cleanId = (creatorId || '').trim();

  if (!cleanKey) {
    throw new Error('Roblox API Key tidak boleh kosong.');
  }
  if (!cleanId) {
    throw new Error('Roblox Creator ID tidak boleh kosong.');
  }

  const safeName = displayName ? displayName.slice(0, 50).trim() : 'Maxistrong Audio';
  const safeDesc = (description || 'Uploaded via Maxistrong Audio Downloader').slice(0, 500);

  const creationContext = {
    creator: creatorType === 'group' 
      ? { groupId: cleanId }
      : { userId: cleanId }
  };

  const requestPayload = {
    assetType: 'Audio',
    displayName: safeName,
    description: safeDesc,
    creationContext
  };

  const fileBuffer = await fs.readFile(filePath);
  const fileName = path.basename(filePath);

  const formData = new FormData();
  formData.append('request', JSON.stringify(requestPayload));
  formData.append('fileContent', new Blob([fileBuffer], { type: 'audio/mpeg' }), fileName);

  console.log(`[ROBLOX] Uploading "${safeName}" to Roblox Open Cloud for ${creatorType} ${cleanId}...`);

  const uploadRes = await fetch(ROBLOX_ASSETS_API, {
    method: 'POST',
    headers: {
      'x-api-key': cleanKey
    },
    body: formData
  });

  const uploadData = await uploadRes.json().catch(() => ({})) as any;

  if (!uploadRes.ok) {
    const errMsg = uploadData.message || uploadData.error || `HTTP ${uploadRes.status}`;
    console.error(`[ROBLOX] Upload failed:`, errMsg);
    throw new Error(`Roblox Upload Gagal: ${errMsg}`);
  }

  if (uploadData.path) {
    const operationPath = uploadData.path;
    console.log(`[ROBLOX] Asset operation queued: ${operationPath}. Polling status...`);
    return await pollOperationStatus(operationPath, cleanKey);
  }

  if (uploadData.assetId || uploadData.response?.assetId) {
    const assetId = uploadData.assetId || uploadData.response.assetId;
    const moderationState = uploadData.response?.moderationResult?.moderationState || 'MODERATION_STATE_APPROVED';
    return {
      assetId: String(assetId),
      assetUrl: `https://create.roblox.com/dashboard/creations/marketplace/${assetId}/configure`,
      moderationState
    };
  }

  throw new Error('Respons dari Roblox tidak memuat ID operasi atau Asset ID yang valid.');
}

async function pollOperationStatus(operationPath: string, apiKey: string, maxAttempts: number = 20, delayMs: number = 1500): Promise<RobloxUploadResult> {
  const url = `${ROBLOX_OPERATIONS_API}/${operationPath}`;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise(r => setTimeout(r, delayMs));

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey
        }
      });

      if (!res.ok) {
        console.warn(`[ROBLOX] Poll attempt ${attempt} returned HTTP ${res.status}`);
        continue;
      }

      const data = await res.json() as any;

      if (data.done) {
        if (data.error) {
          throw new Error(data.error.message || 'Operasi Roblox gagal diproses.');
        }

        const asset = data.response;
        if (!asset || !asset.assetId) {
          throw new Error('Roblox menyelesaikan operasi tetapi tidak mengembalikan Asset ID.');
        }

        const assetId = String(asset.assetId);
        const moderationState = asset.moderationResult?.moderationState || 'MODERATION_STATE_APPROVED';
        console.log(`[ROBLOX] Asset successfully published! Asset ID: ${assetId} (${moderationState})`);

        return {
          assetId,
          assetUrl: `https://create.roblox.com/dashboard/creations/marketplace/${assetId}/configure`,
          moderationState
        };
      }
    } catch (err) {
      if (attempt === maxAttempts) throw err;
    }
  }

  throw new Error('Waktu tunggu proses Roblox melebihi batas (Timeout 30 detik).');
}
