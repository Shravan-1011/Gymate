import {
  File,
  Paths,
} from 'expo-file-system';

import * as Sharing from 'expo-sharing';

import * as DocumentPicker from 'expo-document-picker';

import {
  exportGymateBackup,
  importGymateBackup,
  parseGymateBackup,
  serializeGymateBackup,
  getGymateBackupSummary,
} from './backupService';

import type {
  GymateBackup,
  GymateBackupResult,
} from '../types/backup';


/*
 * ========================================
 * CONSTANTS
 * ========================================
 */

const BACKUP_EXTENSION =
  '.gymate';

const BACKUP_MIME_TYPE =
  'application/json';


/*
 * ========================================
 * BACKUP FILE NAME
 * ========================================
 */

function createBackupFileName(
  username?: string
): string {

  const safeUsername =
    (username ?? 'gymate')
      .trim()
      .replace(
        /[^a-zA-Z0-9_-]/g,
        '_'
      )
      .replace(
        /_+/g,
        '_'
      );

  const date =
    new Date()
      .toISOString()
      .slice(0, 10);

  return (
    `Gymate_${safeUsername}_${date}${BACKUP_EXTENSION}`
  );
}


/*
 * ========================================
 * CREATE BACKUP FILE
 * ========================================
 */

export async function createGymateBackupFile(
  profileId: string
): Promise<{
  file: File;
  backup: GymateBackup;
}> {

  if (!profileId) {
    throw new Error(
      'PROFILE_ID_REQUIRED'
    );
  }


  const backup =
    await exportGymateBackup(
      profileId
    );


  const json =
    serializeGymateBackup(
      backup
    );


  const file =
    new File(
      Paths.cache,
      createBackupFileName(
        backup.profile.username
      )
    );


  if (file.exists) {
    file.delete();
  }


  file.create();


  await file.write(
    json
  );


  return {
    file,
    backup,
  };
}


/*
 * ========================================
 * EXPORT / SHARE BACKUP
 * ========================================
 */

export async function shareGymateBackup(
  profileId: string
): Promise<{
  fileUri: string;
  backup: GymateBackup;
}> {

  const {
    file,
    backup,
  } =
    await createGymateBackupFile(
      profileId
    );


  const available =
    await Sharing.isAvailableAsync();

  if (!available) {
    throw new Error(
      'SHARING_NOT_AVAILABLE'
    );
  }


  await Sharing.shareAsync(
    file.uri,
    {
      mimeType:
        BACKUP_MIME_TYPE,

      dialogTitle:
        'Export Gymate Backup',
    }
  );


  return {
    fileUri:
      file.uri,

    backup,
  };
}


/*
 * ========================================
 * PICK GYMATE BACKUP FILE
 * ========================================
 *
 * IMPORTANT:
 *
 * We deliberately use:
 *
 * copyToCacheDirectory: false
 *
 * The previous implementation asked
 * DocumentPicker to create a cache copy.
 *
 * In Expo Go on Android, that produced:
 *
 *   cache/DocumentPicker/...gymate
 *   isn't readable
 *
 * We now keep the original document-provider
 * URI and use the URI's granted access.
 * ========================================
 */

export async function pickGymateBackupFile(): Promise<{
  backup: GymateBackup;
  filename: string;
}> {

  /*
   * ======================================
   * OPEN DOCUMENT PICKER
   * ======================================
   */

  const result =
    await DocumentPicker.getDocumentAsync({
      type: '*/*',

      /*
       * IMPORTANT:
       *
       * Do NOT ask Expo to create its own
       * DocumentPicker cache copy.
       */

      copyToCacheDirectory: false,

      multiple: false,
    });


  /*
   * ======================================
   * USER CANCELLED
   * ======================================
   */

  if (
    result.canceled ||
    !result.assets ||
    result.assets.length === 0
  ) {
    throw new Error(
      'BACKUP_PICKER_CANCELLED'
    );
  }


  /*
   * ======================================
   * SELECTED FILE
   * ======================================
   */

  const asset =
    result.assets[0];


  /*
   * ======================================
   * FILE NAME
   * ======================================
   */

  const filename =
    asset.name ||
    'backup.gymate';


  const lowerFilename =
    filename.toLowerCase();


  /*
   * ======================================
   * FILE TYPE VALIDATION
   * ======================================
   */

  if (
    !lowerFilename.endsWith(
      BACKUP_EXTENSION
    )
  ) {
    throw new Error(
      'INVALID_BACKUP_FILE_TYPE'
    );
  }


  /*
   * ======================================
   * READ THE SELECTED DOCUMENT
   * ======================================
   *
   * The URI returned by DocumentPicker is
   * intentionally kept intact.
   *
   * We use the modern Expo File API here.
   */

  let json: string;

  try {

    const file =
      new File(
        asset.uri
      );


    json =
      await file.text();

  } catch (error) {

    console.error(
      'Gymate backup document read failed:',
      error
    );


    const message =
      error instanceof Error
        ? error.message
        : String(error);


    throw new Error(
      `BACKUP_FILE_READ_FAILED:${message}`
    );
  }


  /*
   * ======================================
   * EMPTY FILE CHECK
   * ======================================
   */

  if (
    !json ||
    !json.trim()
  ) {
    throw new Error(
      'BACKUP_FILE_EMPTY'
    );
  }


  /*
   * ======================================
   * PARSE + VALIDATE
   * ======================================
   */

  let backup: GymateBackup;

  try {

    backup =
      parseGymateBackup(
        json
      );

  } catch (error) {

    console.error(
      'Gymate backup validation failed:',
      error
    );

    throw error;
  }


  /*
   * ======================================
   * RETURN
   * ======================================
   */

  return {
    backup,

    filename,
  };
}


/*
 * ========================================
 * PREVIEW BACKUP
 * ========================================
 */

export function getBackupPreview(
  backup: GymateBackup
): {
  username: string;
  createdAt: string;
  recordCount: number;
} {

  return getGymateBackupSummary(
    backup
  );
}


/*
 * ========================================
 * RESTORE BACKUP
 * ========================================
 */

export async function restoreGymateBackup(
  profileId: string,
  backup: GymateBackup
): Promise<GymateBackupResult> {

  if (!profileId) {
    throw new Error(
      'PROFILE_ID_REQUIRED'
    );
  }


  return importGymateBackup(
    profileId,
    backup
  );
}


/*
 * ========================================
 * IMPORT FROM FILE
 * ========================================
 */

export async function importGymateBackupFile(
  profileId: string
): Promise<{
  backup: GymateBackup;

  fileName: string;

  preview: {
    username: string;

    createdAt: string;

    recordCount: number;
  };
}> {

  if (!profileId) {
    throw new Error(
      'PROFILE_ID_REQUIRED'
    );
  }


  const {
    backup,
    filename,
  } =
    await pickGymateBackupFile();


  const preview =
    getBackupPreview(
      backup
    );


  return {
    backup,

    fileName:
      filename,

    preview,
  };
}