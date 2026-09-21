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

/*
 * ========================================
 * ACTIVE PROFILE STORAGE
 * ========================================
 *
 * SQLite stores the actual profile data.
 *
 * AsyncStorage only remembers which profile
 * is currently logged in.
 *
 * We do NOT store the password here.
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
   *
   * App starts:
   *
   * AsyncStorage
   *      ↓
   * profile ID
   *      ↓
   * SQLite profiles
   *      ↓
   * SQLite profile_details
   *      ↓
   * SQLite progression
   *      ↓
   * Context state
   */

  useEffect(() => {
    const loadActiveProfile =
      async () => {
        try {
          /*
           * Get active profile ID.
           */

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
           *
           * It is completely valid for this
           * to be null because a newly created
           * account may not have completed
           * profile setup yet.
           */

          const storedProfileDetails =
            await getProfileDetails(
              storedProfile.id
            );

          /*
           * Load progression.
           *
           * getOrCreateProgression() makes sure
           * every authenticated profile has
           * exactly one progression record.
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
   *
   * Creates the authentication/account
   * portion of the profile.
   *
   * Fitness details are created separately
   * through createProfileDetails().
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
     * Check username before hashing.
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
      await hashPassword(password);

    /*
     * Create account in SQLite.
     */

    const newProfile =
      await createProfileInDatabase(
        trimmedUsername,
        passwordHash
      );

    /*
     * Automatically authenticate the
     * newly created profile.
     */

    await AsyncStorage.setItem(
      ACTIVE_PROFILE_KEY,
      newProfile.id
    );

    /*
     * Create progression record.
     */

    const newProgression =
      await getOrCreateProgression(
        newProfile.id
      );

    /*
     * Update context state.
     *
     * Profile details do not exist yet.
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
     * Update context state.
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
    /*
     * Remove active profile ID.
     */

    await AsyncStorage.removeItem(
      ACTIVE_PROFILE_KEY
    );

    /*
     * Clear context state.
     */

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
      /*
       * Authentication check.
       */

      if (!profile) {
        throw new Error(
          'NOT_AUTHENTICATED'
        );
      }

      /*
       * Create details in SQLite.
       */

      const newDetails =
        await createProfileDetails(
          profile.id,
          details
        );

      /*
       * Update context.
       */

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
      /*
       * Authentication check.
       */

      if (!profile) {
        throw new Error(
          'NOT_AUTHENTICATED'
        );
      }

      /*
       * Update details in SQLite.
       */

      const updatedDetails =
        await updateProfileDetails(
          profile.id,
          updates
        );

      /*
       * Update context.
       */

      setProfileDetails(
        updatedDetails
      );

      return updatedDetails;
    };

  /*
   * ========================================
   * REFRESH PROFILE
   * ========================================
   *
   * Reloads:
   *
   * profile
   * profileDetails
   * progression
   *
   * Useful after editing profile data or
   * when another system changes progression.
   */

  const refreshProfile =
    async (): Promise<void> => {
      /*
       * No authenticated profile.
       */

      if (!profile) {
        return;
      }

      /*
       * Reload account profile.
       */

      const updatedProfile =
        await getProfileById(
          profile.id
        );

      /*
       * Account disappeared.
       */

      if (!updatedProfile) {
        await logout();

        return;
      }

      /*
       * Reload profile details.
       */

      const updatedProfileDetails =
        await getProfileDetails(
          profile.id
        );

      /*
       * Reload progression.
       */

      const updatedProgression =
        await getOrCreateProgression(
          profile.id
        );

      /*
       * Update context state.
       */

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
        /*
         * Profile
         */

        profile,

        /*
         * Profile details
         */

        profileDetails,

        /*
         * Progression
         */

        progression,

        /*
         * Loading
         */

        isLoading,

        /*
         * Authentication
         */

        isAuthenticated:
          profile !== null,

        /*
         * Authentication actions
         */

        createProfile,

        login,

        logout,

        /*
         * Profile details actions
         */

        createProfileDetails:
          handleCreateProfileDetails,

        updateProfileDetails:
          handleUpdateProfileDetails,

        /*
         * Refresh
         */

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
    useContext(ProfileContext);

  if (!context) {
    throw new Error(
      'useProfile must be used inside ProfileProvider'
    );
  }

  return context;
}