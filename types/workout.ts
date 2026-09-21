                        export type MuscleGroup =
                            | 'chest'
                        | 'upper-chest'
                        | 'back'
                        | 'lats'
                        | 'traps'
                        | 'shoulders'
                        | 'rear-delts'
                        | 'biceps'
                        | 'triceps'
                        | 'forearms'
                        | 'quads'
                        | 'hamstrings'
                        | 'glutes'
                        | 'calves'
                        | 'abs'
                        | 'hip-flexors';

                        export type WorkoutSplit = {
                        id: string;
                        name: string;
                        shortDescription: string;
                        targetMuscles: MuscleGroup[];
                        recommendedExerciseIds: string[];
                        };

                        export type Exercise = {
                        id: string;
                        name: string;
                        

                        primaryMuscle: MuscleGroup;
                        secondaryMuscles: MuscleGroup[];

                        equipment: string;

                        isCustom: boolean;

                        
                        };

                        export type SetType =
                        | 'warmup'
                        | 'working'
                        | 'drop'
                        | 'failure';

                        export type WorkoutSet = {
                        id: string;
                        setNumber: number;

                        type: SetType;

                        weight: number;
                        reps: number;

                        completed: boolean;
                        };

                        export type WorkoutExercise = {
                        exercise: Exercise;

                        sets: WorkoutSet[];

                        notes?: string;
                        };

                        export type WorkoutSession = {
                        id: string;
                        splitId: string;
                        name: string;
                        startedAt?: string;
                        endedAt?: string;
                        status: 'draft' | 'active' | 'completed';
                        exercises: WorkoutExercise[];
                        };

                        export type WorkoutTemplate = {
                        id: string;

                        name: string;

                        exercises: Exercise[];

                        createdAt: string;
                        };

                        export type ActiveWorkout = {
                        id: string;
                        splitId: string;
                        name: string;
                        startedAt: string;
                        exercises: WorkoutExercise[];
                        };