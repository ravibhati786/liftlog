// Built-in training plans. Each plan is an ordered rotation of workout days: "Today" always
// offers the next day in the rotation, so a missed day shifts the week instead of skipping it.
//
// An exercise slot is [exerciseId, sets, repsMin, repsMax, restSeconds]. Ids are ExerciseDB ids
// (see js/exercises.js). For timed exercises (see TIMED in exercises.js) reps are seconds.

const s = (id, sets, min, max, rest) => ({ id, sets, min, max, rest })

export const PLANS = [
  {
    id: 'ulppl',
    name: 'Upper / Lower / Push / Pull / Legs',
    short: 'ULPPL',
    level: 'Beginner – Intermediate',
    about: 'The best all-rounder. Two strength-focused days to start the week, then a push, pull and leg day for size. Every muscle is trained twice a week.',
    schedule: 'Mon – Fri, weekends off',
    days: [
      {
        name: 'Upper (Strength)', focus: 'Chest · Back · Shoulders · Arms',
        ex: [s('0025', 4, 5, 8, 150), s('0027', 4, 6, 8, 150), s('0405', 3, 8, 10, 120), s('2330', 3, 8, 12, 90), s('0031', 2, 10, 12, 60), s('0200', 2, 10, 12, 60)]
      },
      {
        name: 'Lower (Strength)', focus: 'Quads · Hamstrings · Glutes · Calves',
        ex: [s('0043', 4, 5, 8, 180), s('0085', 3, 6, 10, 150), s('0739', 3, 10, 12, 120), s('0586', 3, 10, 12, 75), s('0605', 4, 10, 15, 60), s('2135', 3, 30, 45, 60)]
      },
      {
        name: 'Push', focus: 'Chest · Shoulders · Triceps',
        ex: [s('0314', 4, 8, 10, 120), s('0577', 3, 10, 12, 90), s('0227', 3, 12, 15, 60), s('0334', 4, 12, 15, 60), s('0194', 3, 10, 12, 60), s('0251', 2, 8, 12, 90)]
      },
      {
        name: 'Pull', focus: 'Back · Rear delts · Biceps',
        ex: [s('0652', 3, 6, 10, 120), s('0861', 4, 8, 12, 90), s('0292', 3, 10, 12, 75), s('0203', 3, 12, 15, 60), s('0318', 3, 10, 12, 60), s('0313', 2, 10, 12, 60)]
      },
      {
        name: 'Legs & Core', focus: 'Quads · Glutes · Hamstrings · Abs',
        ex: [s('0410', 3, 8, 12, 90), s('1409', 3, 8, 12, 90), s('0585', 3, 12, 15, 60), s('0599', 3, 10, 12, 60), s('0605', 3, 12, 15, 60), s('0472', 3, 10, 15, 60)]
      }
    ]
  },
  {
    id: 'bro',
    name: 'Classic Body-Part Split',
    short: 'Bro split',
    level: 'Intermediate',
    about: 'One big muscle group per day with lots of volume. Familiar, simple to follow and great for building size — each muscle gets a full session once a week.',
    schedule: 'Mon – Fri, weekends off',
    days: [
      {
        name: 'Chest', focus: 'Chest · Front delts · Triceps',
        ex: [s('0025', 4, 6, 10, 150), s('0314', 3, 8, 12, 120), s('0577', 3, 10, 12, 90), s('0596', 3, 12, 15, 60), s('0251', 3, 8, 12, 90), s('0175', 3, 12, 15, 60)]
      },
      {
        name: 'Back', focus: 'Lats · Mid-back · Lower back',
        ex: [s('0032', 3, 5, 6, 180), s('0652', 3, 6, 10, 120), s('0027', 3, 8, 10, 120), s('2330', 3, 10, 12, 90), s('0861', 3, 10, 12, 75), s('0238', 2, 12, 15, 60)]
      },
      {
        name: 'Legs', focus: 'Quads · Hamstrings · Glutes · Calves',
        ex: [s('0043', 4, 6, 10, 180), s('0739', 3, 10, 12, 120), s('0085', 3, 8, 10, 120), s('0585', 3, 12, 15, 60), s('0586', 3, 10, 12, 60), s('0605', 4, 12, 15, 60)]
      },
      {
        name: 'Shoulders', focus: 'Delts · Traps · Core',
        ex: [s('0091', 4, 6, 10, 150), s('0334', 4, 12, 15, 60), s('0178', 3, 12, 15, 60), s('0378', 3, 12, 15, 60), s('0406', 3, 10, 12, 60), s('2135', 3, 30, 60, 60)]
      },
      {
        name: 'Arms & Abs', focus: 'Biceps · Triceps · Abs',
        ex: [s('0031', 3, 8, 12, 75), s('0060', 3, 8, 12, 75), s('0318', 3, 10, 12, 60), s('0194', 3, 10, 12, 60), s('0313', 3, 10, 12, 60), s('0200', 3, 12, 15, 60), s('0472', 3, 10, 15, 60)]
      }
    ]
  },
  {
    id: 'hybrid',
    name: 'Strength + Conditioning',
    short: 'Hybrid',
    level: 'All levels',
    about: 'Lift heavy four days and spend one day on cardio and core. Builds strength, keeps your heart and lungs fit and helps with fat loss — ideal for general fitness.',
    schedule: 'Mon – Fri, weekends off',
    days: [
      {
        name: 'Upper A', focus: 'Chest · Back · Shoulders',
        ex: [s('0025', 4, 6, 8, 150), s('0861', 4, 8, 10, 90), s('0405', 3, 8, 10, 90), s('2330', 3, 10, 12, 75), s('0334', 3, 12, 15, 60)]
      },
      {
        name: 'Lower A', focus: 'Squat focus · Calves · Core',
        ex: [s('0043', 4, 6, 8, 180), s('0085', 3, 8, 10, 120), s('0336', 3, 10, 12, 90), s('0605', 3, 12, 15, 60), s('0175', 3, 12, 15, 60)]
      },
      {
        name: 'Conditioning & Core', focus: 'Cardio · Full body · Abs',
        ex: [s('0549', 4, 15, 20, 60), s('1160', 3, 10, 12, 60), s('0630', 3, 30, 40, 45), s('0128', 3, 30, 40, 45), s('2133', 3, 30, 45, 60), s('0472', 3, 10, 12, 60), s('2135', 3, 30, 60, 45)]
      },
      {
        name: 'Upper B', focus: 'Back · Chest · Arms',
        ex: [s('0027', 4, 6, 8, 150), s('0314', 3, 8, 10, 90), s('0652', 3, 6, 10, 120), s('0378', 3, 12, 15, 60), s('0031', 2, 10, 12, 60), s('0200', 2, 10, 12, 60)]
      },
      {
        name: 'Lower B + Finisher', focus: 'Hinge focus · Glutes · Cardio',
        ex: [s('0032', 3, 5, 6, 180), s('0739', 3, 10, 12, 120), s('1409', 3, 10, 12, 90), s('0586', 3, 10, 12, 60), s('3666', 1, 600, 900, 0)]
      }
    ]
  },
  {
    id: 'fb3',
    name: 'Full Body 3-Day (Busy Weeks)',
    short: 'Full body',
    level: 'All levels',
    about: 'For weeks when five days isn’t realistic. Three whole-body sessions hit everything that matters in about an hour each.',
    schedule: 'Mon · Wed · Fri',
    days: [
      {
        name: 'Full Body A', focus: 'Squat · Bench · Row',
        ex: [s('0043', 3, 6, 8, 150), s('0025', 3, 6, 8, 150), s('0861', 3, 8, 12, 90), s('0334', 3, 12, 15, 60), s('2135', 3, 30, 45, 60)]
      },
      {
        name: 'Full Body B', focus: 'Deadlift · Press · Pull-up',
        ex: [s('0032', 3, 5, 6, 180), s('0405', 3, 8, 10, 90), s('0652', 3, 6, 10, 120), s('0410', 3, 10, 12, 90), s('0472', 3, 10, 12, 60)]
      },
      {
        name: 'Full Body C', focus: 'Leg press · Incline · Pulldown',
        ex: [s('0739', 3, 10, 12, 120), s('0314', 3, 8, 12, 90), s('2330', 3, 10, 12, 75), s('0586', 3, 10, 12, 60), s('0031', 2, 10, 12, 60), s('0200', 2, 10, 12, 60)]
      }
    ]
  }
]

export const planById = id => PLANS.find(p => p.id === id)
