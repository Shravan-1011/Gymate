import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  createProfile as createProfileInDatabase,
  deleteProfile,
  findProfileByUsername,
  getProfileById,
  type Profile,
} from '../database/profileRepository';

import {
  createProfileDetails,
  getProfileDetails,
  updateProfileDetails,
  type ProfileDetails,
} from '../database/profileDetailsRepository';

import {
  getOrCreateProgression,
  type ProfileProgression,
} from '../database/progressionRepository';

import {
  hashPassword,
  verifyPassword,
} from '../utils/password';

import {
  importGymateBackup,
} from '../services/backupService';

import type {
  GymateBackup,
} from '../types/backup';


/*
 * ========================================
 * ACTIVE PROFILE STORAGE
 * ========================================
 */

const ACTIVE_PROFILE_KEY =
  '@gymate/active-profile-id';


/*
 * ========================================
 * CONTEXT TYPE
 * ========================================
 */

type ProfileContextType = {
  profile: Profile | null;

  profileDetails: ProfileDetails | null;

  progression: ProfileProgression | null;

  isLoading: boolean;

  isAuthenticated: boolean;

  createProfile: (
    username: string,
    password: string
  ) => Promise<Profile>;

  restoreBackupAsNewProfile: (
    backup: GymateBackup,
    password: string
  ) => Promise<Profile>;

  login: (
    username: string,
    password: string
  ) => Promise<Profile>;

  logout: () => Promise<void>;

  createProfileDetails: (
    details: {
      displayName: string;
      age?: number | null;
      heightCm?: number | null;
      weightKg?: number | null;
      fitnessGoal?: string | null;
      activityLevel?: string | null;
    }
  ) => Promise<ProfileDetails>;

  updateProfileDetails: (
    updates: {
      displayName?: string;
      age?: number | null;
      heightCm?: number | null;
      weightKg?: number | null;
      fitnessGoal?: string | null;
      activityLevel?: string | null;
    }
  ) => Promise<ProfileDetails | null>;

  refreshProfile: () => Promise<void>;
};


/*
 * ========================================
 * CONTEXT
 * ========================================
 */

const ProfileContext =
  createContext<
    ProfileContextType | undefined
  >(undefined);


/*
 * ========================================
 * PROVIDER
 * ========================================
 */

export function ProfileProvider({
  children,
}: {
  children: ReactNode;
}) {

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [
    profileDetails,
    setProfileDetails,
  ] = useState<ProfileDetails | null>(
    null
  );

  const [
    progression,
    setProgression,
  ] = useState<ProfileProgression | null>(
    null
  );

  const [isLoading, setIsLoading] =
    useState(true);


  /*
   * ======================================
   * LOAD ACTIVE PROFILE
   * ======================================
   */

  useEffect(() => {

    const loadActiveProfile =
      async () => {

        try {

          const storedProfileId =
            await AsyncStorage.getItem(
              ACTIVE_PROFILE_KEY
            );


          /*
           * No active profile.
           */

          if (!storedProfileId) {

            setProfile(null);
            setProfileDetails(null);
            setProgression(null);

            return;
          }


          /*
           * Load account profile.
           */

          const storedProfile =
            await getProfileById(
              storedProfileId
            );


          /*
           * Profile no longer exists.
           */

          if (!storedProfile) {

            await AsyncStorage.removeItem(
              ACTIVE_PROFILE_KEY
            );

            setProfile(null);
            setProfileDetails(null);
            setProgression(null);

            return;
          }


          /*
           * Load profile details.
           */

          const storedProfileDetails =
            await getProfileDetails(
              storedProfile.id
            );


          /*
           * Load progression.
           */

          const storedProgression =
            await getOrCreateProgression(
              storedProfile.id
            );


          /*
           * Update context state.
           */

          setProfile(
            storedProfile
          );

          setProfileDetails(
            storedProfileDetails
          );

          setProgression(
            storedProgression
          );

        } catch (error) {

          console.error(
            'Failed to load active profile:',
            error
          );

          setProfile(null);
          setProfileDetails(null);
          setProgression(null);

        } finally {

          setIsLoading(false);

        }

      };


    loadActiveProfile();

  }, []);


  /*
   * ========================================
   * CREATE PROFILE
   * ========================================
   */

  const createProfile = async (
    username: string,
    password: string
  ): Promise<Profile> => {

    const trimmedUsername =
      username.trim();


    /*
     * USERNAME
     */

    if (!trimmedUsername) {

      throw new Error(
        'USERNAME_REQUIRED'
      );

    }


    /*
     * PASSWORD
     */

    if (!password) {

      throw new Error(
        'PASSWORD_REQUIRED'
      );

    }


    if (password.length < 6) {

      throw new Error(
        'PASSWORD_TOO_SHORT'
      );

    }


    /*
     * Check username.
     */

    const existingProfile =
      await findProfileByUsername(
        trimmedUsername
      );


    if (existingProfile) {

      throw new Error(
        'USERNAME_ALREADY_EXISTS'
      );

    }


    /*
     * Hash password.
     */

    const passwordHash =
      await hashPassword(
        password
      );


    /*
     * Create account.
     */

    const newProfile =
      await createProfileInDatabase(
        trimmedUsername,
        passwordHash
      );


    /*
     * Authenticate.
     */

    await AsyncStorage.setItem(
      ACTIVE_PROFILE_KEY,
      newProfile.id
    );


    /*
     * Create progression.
     */

    const newProgression =
      await getOrCreateProgression(
        newProfile.id
      );


    /*
     * Update context.
     */

    setProfile(
      newProfile
    );

    setProfileDetails(
      null
    );

    setProgression(
      newProgression
    );


    return newProfile;
  };


  /*
   * ========================================
   * RESTORE BACKUP AS NEW PROFILE
   * ========================================
   *
   * Used during first-launch migration.
   *
   * The backup provides:
   *
   * - username
   * - profile data
   * - Gymate data
   *
   * The user provides:
   *
   * - NEW password
   *
   * Passwords are never stored in the
   * backup file.
   */

  const restoreBackupAsNewProfile =
    async (
      backup: GymateBackup,
      password: string
    ): Promise<Profile> => {

      /*
       * Validate password.
       */

      if (!password) {

        throw new Error(
          'PASSWORD_REQUIRED'
        );

      }


      if (password.length < 6) {

        throw new Error(
          'PASSWORD_TOO_SHORT'
        );

      }


      /*
       * Get username from backup.
       */

      const username =
        backup.profile.username.trim();


      if (!username) {

        throw new Error(
          'USERNAME_REQUIRED'
        );

      }


      /*
       * Make sure this username isn't
       * already being used locally.
       */

      const existingProfile =
        await findProfileByUsername(
          username
        );


      if (existingProfile) {

        throw new Error(
          'USERNAME_ALREADY_EXISTS'
        );

      }


      /*
       * Create a NEW password hash.
       *
       * The old password is never present
       * in the backup.
       */

      const passwordHash =
        await hashPassword(
          password
        );


      /*
       * Create destination profile.
       */

      const newProfile =
        await createProfileInDatabase(
          username,
          passwordHash
        );


      try {

        /*
         * Authenticate destination profile.
         */

        await AsyncStorage.setItem(
          ACTIVE_PROFILE_KEY,
          newProfile.id
        );


        /*
         * Create the initial progression
         * required by the account.
         *
         * The backup import will replace it
         * with the backed-up progression.
         */

        await getOrCreateProgression(
          newProfile.id
        );


        /*
         * Restore all Gymate data.
         *
         * backup.profile.id may be different
         * from newProfile.id.
         *
         * backupService remaps all profile_id
         * values to newProfile.id.
         */

        await importGymateBackup(
          newProfile.id,
          backup
        );


        /*
         * Reload everything from SQLite.
         *
         * This is important because the
         * backup has now replaced the
         * initial profile details and
         * progression.
         */

        const restoredProfile =
          await getProfileById(
            newProfile.id
          );


        if (!restoredProfile) {

          throw new Error(
            'PROFILE_NOT_FOUND_AFTER_RESTORE'
          );

        }


        const restoredDetails =
          await getProfileDetails(
            newProfile.id
          );


        const restoredProgression =
          await getOrCreateProgression(
            newProfile.id
          );


        /*
         * Update context with the restored
         * data.
         */

        setProfile(
          restoredProfile
        );

        setProfileDetails(
          restoredDetails
        );

        setProgression(
          restoredProgression
        );


        return restoredProfile;

      } catch (error) {

        /*
         * If anything goes wrong during
         * restore, remove the newly-created
         * profile.
         *
         * This prevents a half-created
         * migration account.
         */

        try {

          await AsyncStorage.removeItem(
            ACTIVE_PROFILE_KEY
          );

        } catch {
          // Ignore cleanup error.
        }


        try {

          await deleteProfile(
            newProfile.id
          );

        } catch (cleanupError) {

          console.error(
            'Failed to clean up failed backup profile:',
            cleanupError
          );

        }


        setProfile(null);
        setProfileDetails(null);
        setProgression(null);


        throw error;
      }
    };


  /*
   * ========================================
   * LOGIN
   * ========================================
   */

  const login = async (
    username: string,
    password: string
  ): Promise<Profile> => {

    const trimmedUsername =
      username.trim();


    /*
     * USERNAME
     */

    if (!trimmedUsername) {

      throw new Error(
        'USERNAME_REQUIRED'
      );

    }


    /*
     * PASSWORD
     */

    if (!password) {

      throw new Error(
        'PASSWORD_REQUIRED'
      );

    }


    /*
     * Find profile.
     */

    const foundProfile =
      await findProfileByUsername(
        trimmedUsername
      );


    if (!foundProfile) {

      throw new Error(
        'INVALID_CREDENTIALS'
      );

    }


    /*
     * Verify password.
     */

    const passwordValid =
      await verifyPassword(
        password,
        foundProfile.passwordHash
      );


    if (!passwordValid) {

      throw new Error(
        'INVALID_CREDENTIALS'
      );

    }


    /*
     * Save active profile.
     */

    await AsyncStorage.setItem(
      ACTIVE_PROFILE_KEY,
      foundProfile.id
    );


    /*
     * Load profile details.
     */

    const foundProfileDetails =
      await getProfileDetails(
        foundProfile.id
      );


    /*
     * Load progression.
     */

    const foundProgression =
      await getOrCreateProgression(
        foundProfile.id
      );


    /*
     * Update context.
     */

    setProfile(
      foundProfile
    );

    setProfileDetails(
      foundProfileDetails
    );

    setProgression(
      foundProgression
    );


    return foundProfile;
  };


  /*
   * ========================================
   * LOGOUT
   * ========================================
   */

  const logout = async (): Promise<void> => {

    await AsyncStorage.removeItem(
      ACTIVE_PROFILE_KEY
    );

    setProfile(null);

    setProfileDetails(null);

    setProgression(null);
  };


  /*
   * ========================================
   * CREATE PROFILE DETAILS
   * ========================================
   */

  const handleCreateProfileDetails =
    async (
      details: {
        displayName: string;
        age?: number | null;
        heightCm?: number | null;
        weightKg?: number | null;
        fitnessGoal?: string | null;
        activityLevel?: string | null;
      }
    ): Promise<ProfileDetails> => {

      if (!profile) {

        throw new Error(
          'NOT_AUTHENTICATED'
        );

      }


      const newDetails =
        await createProfileDetails(
          profile.id,
          details
        );


      setProfileDetails(
        newDetails
      );


      return newDetails;
    };


  /*
   * ========================================
   * UPDATE PROFILE DETAILS
   * ========================================
   */

  const handleUpdateProfileDetails =
    async (
      updates: {
        displayName?: string;
        age?: number | null;
        heightCm?: number | null;
        weightKg?: number | null;
        fitnessGoal?: string | null;
        activityLevel?: string | null;
      }
    ): Promise<ProfileDetails | null> => {

      if (!profile) {

        throw new Error(
          'NOT_AUTHENTICATED'
        );

      }


      const updatedDetails =
        await updateProfileDetails(
          profile.id,
          updates
        );


      setProfileDetails(
        updatedDetails
      );


      return updatedDetails;
    };


  /*
   * ========================================
   * REFRESH PROFILE
   * ========================================
   */

  const refreshProfile =
    async (): Promise<void> => {

      if (!profile) {
        return;
      }


      const updatedProfile =
        await getProfileById(
          profile.id
        );


      if (!updatedProfile) {

        await logout();

        return;
      }


      const updatedProfileDetails =
        await getProfileDetails(
          profile.id
        );


      const updatedProgression =
        await getOrCreateProgression(
          profile.id
        );


      setProfile(
        updatedProfile
      );

      setProfileDetails(
        updatedProfileDetails
      );

      setProgression(
        updatedProgression
      );
    };


  /*
   * ========================================
   * PROVIDER
   * ========================================
   */

  return (
    <ProfileContext.Provider
      value={{

        profile,

        profileDetails,

        progression,

        isLoading,

        isAuthenticated:
          profile !== null,

        createProfile,

        restoreBackupAsNewProfile,

        login,

        logout,

        createProfileDetails:
          handleCreateProfileDetails,

        updateProfileDetails:
          handleUpdateProfileDetails,

        refreshProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}


/*
 * ========================================
 * HOOK
 * ========================================
 */

export function useProfile() {

  const context =
    useContext(
      ProfileContext
    );


  if (!context) {

    throw new Error(
      'useProfile must be used inside ProfileProvider'
    );

  }


  return context;
}