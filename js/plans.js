// Built-in training plans. Every workout day is pinned to a weekday (`dow`, 0 = Sunday,
// 1 = Monday … 6 = Saturday) and names the warm-up it starts with (`wu`, a key of WARMUPS).
//
// An exercise slot is s(exerciseId, sets, repsMin, repsMax, restSeconds). Ids are ExerciseDB ids
// (see js/exercises.js). For timed exercises (planks, treadmill…) reps are seconds.

const s = (id, sets, min, max, rest) => ({ id, sets, min, max, rest })

// Warm-ups: ~8–10 minutes, done before the first exercise. `id` links a how-to where one exists.
const easyCardio = { t: '5 min easy cardio', d: 'Treadmill walk, bike or cross-trainer at an easy pace — you should still be able to talk.', id: '3666' }
export const WARMUPS = {
  lower: [
    easyCardio,
    { t: 'Bodyweight squats × 10', d: 'Feet shoulder-width, sit back like onto a chair, chest up, then stand.' },
    { t: 'Glute bridges × 12', d: 'Lie on your back, knees bent, push through your heels and lift your hips.', id: '3013' },
    { t: 'Walking lunges × 6 each leg', d: 'Slow, controlled steps. Hold something for balance if needed.', id: '1460' },
    { t: 'Leg swings × 10 each leg', d: 'Hold a rail and swing one leg forward and back, nice and relaxed.' }
  ],
  upper: [
    easyCardio,
    { t: 'Arm circles × 10 each way', d: 'Arms out to the sides, small circles getting bigger, then reverse.' },
    { t: 'Shoulder rolls × 10', d: 'Roll your shoulders up, back and down.' },
    { t: 'Incline push-ups × 8', d: 'Hands on a bench or bar, body in a straight line, slow and easy.', id: '0493' },
    { t: 'Inchworms × 5', d: 'Walk your hands out to a plank, then walk them back.', id: '1471' }
  ],
  cardio: [
    { t: '5 min easy walk', d: 'Start slow on the treadmill, then build to a brisk pace.', id: '3666' },
    { t: 'Leg swings × 10 each leg', d: 'Hold a rail and swing one leg forward and back.' },
    { t: 'Arm circles × 10 each way', d: 'Small circles getting bigger, then reverse.' },
    { t: 'Bodyweight squats × 10', d: 'Slow and controlled.' }
  ],
  full: [
    easyCardio,
    { t: 'Bodyweight squats × 10', d: 'Sit back like onto a chair, chest up, then stand.' },
    { t: 'Incline push-ups × 8', d: 'Hands on a bench, body straight.', id: '0493' },
    { t: 'Glute bridges × 12', d: 'Push through your heels and lift your hips.', id: '3013' },
    { t: 'Inchworms × 5', d: 'Walk your hands out to a plank and back.', id: '1471' }
  ]
}

export const PLANS = [
  {
    id: 'beginner',
    name: 'Beginner 5-Day (Machines First)',
    short: 'Beginner',
    level: 'Complete beginner',
    recommended: true,
    about: 'Made for your first months in the gym. Mostly machines — they guide the movement, so they’re safe and easy to learn — with light dumbbell moves added slowly. Fewer exercises, higher reps, plenty of rest.',
    schedule: 'Mon – Fri, weekends off',
    days: [
      {
        dow: 1, wu: 'lower', name: 'Legs', focus: 'Quads · Hamstrings · Glutes · Calves',
        ex: [s('0739', 3, 10, 12, 90), s('0599', 3, 10, 12, 75), s('0585', 2, 12, 15, 60), s('0597', 2, 12, 15, 60), s('0594', 2, 12, 15, 45), s('2135', 2, 20, 30, 45)]
      },
      {
        dow: 2, wu: 'upper', name: 'Upper Body A', focus: 'Chest · Back · Shoulders · Arms',
        ex: [s('0577', 3, 10, 12, 90), s('2330', 3, 10, 12, 90), s('0603', 2, 10, 12, 75), s('1350', 2, 10, 12, 75), s('0294', 2, 10, 12, 60), s('0200', 2, 10, 12, 60)]
      },
      {
        dow: 3, wu: 'cardio', name: 'Cardio & Core', focus: 'Heart & lungs · Abs · Glutes',
        ex: [s('3666', 1, 900, 1200, 60), s('0276', 2, 8, 10, 45), s('3013', 2, 12, 15, 45), s('2135', 2, 20, 30, 45)]
      },
      {
        dow: 4, wu: 'lower', name: 'Legs & Glutes', focus: 'Glutes · Hamstrings · Quads',
        ex: [s('1760', 3, 10, 12, 90), s('1459', 3, 10, 12, 90), s('1460', 2, 8, 10, 75), s('0586', 2, 10, 12, 60), s('0605', 2, 12, 15, 45), s('0276', 2, 8, 10, 45)]
      },
      {
        dow: 5, wu: 'upper', name: 'Upper Body B', focus: 'Chest · Back · Shoulders · Arms',
        ex: [s('0289', 3, 10, 12, 90), s('0581', 3, 10, 12, 90), s('0334', 2, 12, 15, 60), s('0596', 2, 12, 15, 60), s('0313', 2, 10, 12, 60), s('0194', 2, 10, 12, 60)]
      }
    ]
  },
  {
    id: 'fb3',
    name: 'Full Body 3-Day (Busy Weeks)',
    short: 'Full body',
    level: 'Beginner friendly',
    about: 'For weeks when five days isn’t realistic. Three whole-body sessions hit everything that matters in about an hour each.',
    schedule: 'Mon · Wed · Fri',
    days: [
      {
        dow: 1, wu: 'full', name: 'Full Body A', focus: 'Legs · Chest · Back',
        ex: [s('0739', 3, 10, 12, 90), s('0577', 3, 10, 12, 90), s('1350', 3, 10, 12, 75), s('0334', 2, 12, 15, 60), s('2135', 2, 20, 40, 45)]
      },
      {
        dow: 3, wu: 'full', name: 'Full Body B', focus: 'Legs · Shoulders · Back',
        ex: [s('1760', 3, 10, 12, 90), s('0603', 3, 10, 12, 75), s('2330', 3, 10, 12, 75), s('0599', 2, 10, 12, 60), s('0276', 2, 8, 10, 45)]
      },
      {
        dow: 5, wu: 'full', name: 'Full Body C', focus: 'Glutes · Chest · Arms',
        ex: [s('1459', 3, 10, 12, 90), s('0289', 3, 10, 12, 90), s('0581', 3, 10, 12, 75), s('0294', 2, 10, 12, 60), s('0200', 2, 10, 12, 60)]
      }
    ]
  },
  {
    id: 'hybrid',
    name: 'Strength + Conditioning',
    short: 'Hybrid',
    level: 'After 2–3 months',
    about: 'Lift heavier on four days and spend one day on cardio and core. Builds strength, keeps your heart and lungs fit and helps with fat loss. Uses free weights (barbells) — move here once the beginner plan feels easy.',
    schedule: 'Mon – Fri, weekends off',
    days: [
      {
        dow: 1, wu: 'lower', name: 'Lower A', focus: 'Squat focus · Calves · Core',
        ex: [s('0043', 4, 6, 8, 180), s('0085', 3, 8, 10, 120), s('0336', 3, 10, 12, 90), s('0605', 3, 12, 15, 60), s('0175', 3, 12, 15, 60)]
      },
      {
        dow: 2, wu: 'upper', name: 'Upper A', focus: 'Chest · Back · Shoulders',
        ex: [s('0025', 4, 6, 8, 150), s('0861', 4, 8, 10, 90), s('0405', 3, 8, 10, 90), s('2330', 3, 10, 12, 75), s('0334', 3, 12, 15, 60)]
      },
      {
        dow: 3, wu: 'cardio', name: 'Conditioning & Core', focus: 'Cardio · Full body · Abs',
        ex: [s('0549', 4, 15, 20, 60), s('1160', 3, 10, 12, 60), s('0630', 3, 30, 40, 45), s('0128', 3, 30, 40, 45), s('2133', 3, 30, 45, 60), s('0472', 3, 10, 12, 60), s('2135', 3, 30, 60, 45)]
      },
      {
        dow: 4, wu: 'lower', name: 'Lower B + Finisher', focus: 'Hinge focus · Glutes · Cardio',
        ex: [s('0032', 3, 5, 6, 180), s('0739', 3, 10, 12, 120), s('1409', 3, 10, 12, 90), s('0586', 3, 10, 12, 60), s('3666', 1, 600, 900, 0)]
      },
      {
        dow: 5, wu: 'upper', name: 'Upper B', focus: 'Back · Chest · Arms',
        ex: [s('0027', 4, 6, 8, 150), s('0314', 3, 8, 10, 90), s('0652', 3, 6, 10, 120), s('0378', 3, 12, 15, 60), s('0031', 2, 10, 12, 60), s('0200', 2, 10, 12, 60)]
      }
    ]
  },
  {
    id: 'ulppl',
    name: 'Power + Size (Lower / Upper / Pull / Legs / Push)',
    short: 'Power + Size',
    level: 'After 3–6 months',
    about: 'Two heavy strength days to start the week, then a pull, leg and push day for muscle size. Every muscle is trained twice a week. Barbell-heavy — for when you’re confident with the main lifts.',
    schedule: 'Mon – Fri, weekends off',
    days: [
      {
        dow: 1, wu: 'lower', name: 'Lower (Strength)', focus: 'Quads · Hamstrings · Glutes · Calves',
        ex: [s('0043', 4, 5, 8, 180), s('0085', 3, 6, 10, 150), s('0739', 3, 10, 12, 120), s('0586', 3, 10, 12, 75), s('0605', 4, 10, 15, 60), s('2135', 3, 30, 45, 60)]
      },
      {
        dow: 2, wu: 'upper', name: 'Upper (Strength)', focus: 'Chest · Back · Shoulders · Arms',
        ex: [s('0025', 4, 5, 8, 150), s('0027', 4, 6, 8, 150), s('0405', 3, 8, 10, 120), s('2330', 3, 8, 12, 90), s('0031', 2, 10, 12, 60), s('0200', 2, 10, 12, 60)]
      },
      {
        dow: 3, wu: 'upper', name: 'Pull', focus: 'Back · Rear delts · Biceps',
        ex: [s('0652', 3, 6, 10, 120), s('0861', 4, 8, 12, 90), s('0292', 3, 10, 12, 75), s('0203', 3, 12, 15, 60), s('0318', 3, 10, 12, 60), s('0313', 2, 10, 12, 60)]
      },
      {
        dow: 4, wu: 'lower', name: 'Legs & Core', focus: 'Quads · Glutes · Hamstrings · Abs',
        ex: [s('0410', 3, 8, 12, 90), s('1409', 3, 8, 12, 90), s('0585', 3, 12, 15, 60), s('0599', 3, 10, 12, 60), s('0605', 3, 12, 15, 60), s('0472', 3, 10, 15, 60)]
      },
      {
        dow: 5, wu: 'upper', name: 'Push', focus: 'Chest · Shoulders · Triceps',
        ex: [s('0314', 4, 8, 10, 120), s('0577', 3, 10, 12, 90), s('0227', 3, 12, 15, 60), s('0334', 4, 12, 15, 60), s('0194', 3, 10, 12, 60), s('0251', 2, 8, 12, 90)]
      }
    ]
  },
  {
    id: 'bro',
    name: 'Classic Body-Part Split',
    short: 'Bro split',
    level: 'After 6+ months',
    about: 'One big muscle group per day with lots of volume. Each muscle gets one hard session a week — best once you know the exercises well.',
    schedule: 'Mon – Fri, weekends off',
    days: [
      {
        dow: 1, wu: 'lower', name: 'Legs', focus: 'Quads · Hamstrings · Glutes · Calves',
        ex: [s('0043', 4, 6, 10, 180), s('0739', 3, 10, 12, 120), s('0085', 3, 8, 10, 120), s('0585', 3, 12, 15, 60), s('0586', 3, 10, 12, 60), s('0605', 4, 12, 15, 60)]
      },
      {
        dow: 2, wu: 'upper', name: 'Chest', focus: 'Chest · Front delts · Triceps',
        ex: [s('0025', 4, 6, 10, 150), s('0314', 3, 8, 12, 120), s('0577', 3, 10, 12, 90), s('0596', 3, 12, 15, 60), s('0251', 3, 8, 12, 90), s('0175', 3, 12, 15, 60)]
      },
      {
        dow: 3, wu: 'upper', name: 'Back', focus: 'Lats · Mid-back · Lower back',
        ex: [s('0032', 3, 5, 6, 180), s('0652', 3, 6, 10, 120), s('0027', 3, 8, 10, 120), s('2330', 3, 10, 12, 90), s('0861', 3, 10, 12, 75), s('0238', 2, 12, 15, 60)]
      },
      {
        dow: 4, wu: 'upper', name: 'Shoulders', focus: 'Delts · Traps · Core',
        ex: [s('0091', 4, 6, 10, 150), s('0334', 4, 12, 15, 60), s('0178', 3, 12, 15, 60), s('0378', 3, 12, 15, 60), s('0406', 3, 10, 12, 60), s('2135', 3, 30, 60, 60)]
      },
      {
        dow: 5, wu: 'upper', name: 'Arms & Abs', focus: 'Biceps · Triceps · Abs',
        ex: [s('0031', 3, 8, 12, 75), s('0060', 3, 8, 12, 75), s('0318', 3, 10, 12, 60), s('0194', 3, 10, 12, 60), s('0313', 3, 10, 12, 60), s('0200', 3, 12, 15, 60), s('0472', 3, 10, 15, 60)]
      }
    ]
  }
]

export const planById = id => PLANS.find(p => p.id === id)

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// Tips shown in "New to the gym?". Plain, practical, first-month advice.
export const BEGINNER_TIPS = [
  ['Start lighter than you think', 'For the first 2 weeks, pick weights where you could easily do 3–4 more reps. You’re learning the movement — getting stronger comes next, and it comes fast.'],
  ['How to choose a weight', 'If you can’t reach the lower rep number, go lighter next set. If the top number feels easy, go a bit heavier. After each workout the app suggests your next weight.'],
  ['Setting up a machine', 'Most machines have a picture sticker showing how to use them. Adjust the seat so the handles or pads line up with the joint that moves (e.g. knees with the pivot on the leg extension). Use the pin to choose the weight.'],
  ['Move slowly, breathe', 'About 2 seconds up and 2 seconds down, no swinging. Breathe out when you push or pull, breathe in on the way back. Don’t hold your breath.'],
  ['Ask for help', 'Asking gym staff to show you a machine is completely normal — they do it all day.'],
  ['Soreness is normal, pain isn’t', 'Feeling sore 1–2 days after is normal in the first weeks. Sharp or joint pain means stop that exercise and try a swap or lighter weight.'],
  ['Rest, sleep, eat', 'Muscles grow while you recover. Aim for 7–8 hours of sleep, drink water, and include protein (eggs, dal, paneer, chicken, curd) with your meals.'],
  ['Missed a day?', 'No problem — just do today’s workout. If you want, you can do a missed one on the weekend.'],
  ['Health first', 'If you have a medical condition, an injury or haven’t exercised in years, check with a doctor before starting.']
]
