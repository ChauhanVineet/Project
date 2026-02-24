// Data Storage
let workouts = JSON.parse(localStorage.getItem('workouts')) || [];
let workoutHistory = JSON.parse(localStorage.getItem('workoutHistory')) || [];
let measurements = JSON.parse(localStorage.getItem('measurements')) || [];
let meals = JSON.parse(localStorage.getItem('meals')) || [];
let currentWorkout = null;
let workoutStartTime = null;
let workoutTimerInterval = null;
let restTimerInterval = null;

// Voice Synthesis
const speak = (text) => {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        speechSynthesis.speak(utterance);
    }
};

// Motivation Messages
const motivationMessages = [
    "Ready to crush your goals today?",
    "Your only limit is you!",
    "Make today count!",
    "Stronger than yesterday!",
    "Push yourself, no one else will!",
    "Success starts with self-discipline!",
    "Train insane or remain the same!",
    "The pain you feel today is the strength you feel tomorrow!"
];

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    updateStats();
    updateMotivation();
    loadSavedWorkouts();
    loadWorkoutHistory();
    loadMeasurementHistory();
    loadMeals();
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            showPage(page);
        });
    });
    
    // Set random motivation every 30 seconds
    setInterval(updateMotivation, 30000);
});

// Navigation
function showPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    document.getElementById(pageName).classList.add('active');
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');
}

// Update Stats
function updateStats() {
    document.getElementById('totalWorkouts').textContent = workoutHistory.length;
    
    const streak = calculateStreak();
    document.getElementById('currentStreak').textContent = streak;
    
    const totalWeight = workoutHistory.reduce((sum, w) => {
        return sum + (w.totalWeight || 0);
    }, 0);
    document.getElementById('totalWeight').textContent = Math.round(totalWeight);
}

function calculateStreak() {
    if (workoutHistory.length === 0) return 0;
    
    const today = new Date().toDateString();
    const sortedHistory = workoutHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let streak = 0;
    let currentDate = new Date();
    
    for (let workout of sortedHistory) {
        const workoutDate = new Date(workout.date).toDateString();
        const checkDate = currentDate.toDateString();
        
        if (workoutDate === checkDate) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            break;
        }
    }
    
    return streak;
}

// Motivation
function updateMotivation() {
    const randomMsg = motivationMessages[Math.floor(Math.random() * motivationMessages.length)];
    document.getElementById('motivationText').textContent = randomMsg;
}

// Exercise Database by Muscle Group
const exerciseDatabase = {
    chest: [
        'Barbell Bench Press',
        'Dumbbell Bench Press',
        'Incline Barbell Bench Press',
        'Incline Dumbbell Press',
        'Decline Barbell Press',
        'Decline Dumbbell Press',
        'Dumbbell Flyes',
        'Cable Flyes',
        'Chest Press Machine',
        'Pec Deck Machine',
        'Push-Ups',
        'Dips (Chest Focus)'
    ],
    back: [
        'Barbell Deadlift',
        'Barbell Row',
        'Dumbbell Row',
        'T-Bar Row',
        'Lat Pulldown',
        'Pull-Ups',
        'Chin-Ups',
        'Seated Cable Row',
        'Face Pulls',
        'Hyperextensions',
        'Shrugs (Barbell)',
        'Shrugs (Dumbbell)'
    ],
    legs: [
        'Barbell Squat',
        'Front Squat',
        'Leg Press',
        'Romanian Deadlift',
        'Leg Curl',
        'Leg Extension',
        'Walking Lunges',
        'Bulgarian Split Squat',
        'Hack Squat',
        'Calf Raises (Standing)',
        'Calf Raises (Seated)',
        'Goblet Squat'
    ],
    shoulders: [
        'Barbell Overhead Press',
        'Dumbbell Shoulder Press',
        'Arnold Press',
        'Lateral Raises',
        'Front Raises',
        'Rear Delt Flyes',
        'Face Pulls',
        'Upright Row',
        'Machine Shoulder Press',
        'Cable Lateral Raises',
        'Reverse Pec Deck'
    ],
    biceps: [
        'Barbell Curl',
        'Dumbbell Curl',
        'Hammer Curl',
        'Preacher Curl',
        'Cable Curl',
        'Concentration Curl',
        'Incline Dumbbell Curl',
        'EZ Bar Curl',
        '21s',
        'Spider Curl'
    ],
    triceps: [
        'Close Grip Bench Press',
        'Tricep Dips',
        'Overhead Tricep Extension',
        'Skull Crushers',
        'Cable Pushdown',
        'Rope Pushdown',
        'Dumbbell Kickback',
        'Diamond Push-Ups',
        'Overhead Cable Extension',
        'Single Arm Cable Extension'
    ],
    core: [
        'Plank',
        'Side Plank',
        'Crunches',
        'Bicycle Crunches',
        'Russian Twists',
        'Leg Raises',
        'Hanging Leg Raises',
        'Cable Crunches',
        'Ab Wheel Rollout',
        'Mountain Climbers',
        'Dead Bug',
        'Pallof Press'
    ]
};

// Workout Creation
let exerciseCount = 0;

function handleWorkoutNameChange() {
    // Function removed - no longer needed
}

function addExercise() {
    exerciseCount++;
    const exerciseList = document.getElementById('exerciseList');
    
    const exerciseDiv = document.createElement('div');
    exerciseDiv.className = 'exercise-item';
    exerciseDiv.innerHTML = `
        <div class="exercise-header">
            <strong>Exercise ${exerciseCount}</strong>
            <button class="remove-btn" onclick="removeExercise(this)">Remove</button>
        </div>
        <select class="input muscle-group" onchange="updateExerciseDropdown(this)">
            <option value="">Select Muscle Group</option>
            <option value="chest">Chest</option>
            <option value="back">Back</option>
            <option value="legs">Legs</option>
            <option value="shoulders">Shoulders</option>
            <option value="biceps">Biceps</option>
            <option value="triceps">Triceps</option>
            <option value="core">Core</option>
        </select>
        <select class="input exercise-name" disabled>
            <option value="">Select exercise first</option>
        </select>
        <input type="number" placeholder="Sets" class="input exercise-sets">
        <input type="number" placeholder="Reps" class="input exercise-reps">
        <input type="number" placeholder="Rest (seconds)" class="input exercise-rest" value="60">
    `;
    
    exerciseList.appendChild(exerciseDiv);
}

function updateExerciseDropdown(selectElement) {
    const muscleGroup = selectElement.value;
    const exerciseItem = selectElement.closest('.exercise-item');
    const exerciseDropdown = exerciseItem.querySelector('.exercise-name');
    
    if (!muscleGroup) {
        exerciseDropdown.disabled = true;
        exerciseDropdown.innerHTML = '<option value="">Select muscle group first</option>';
        return;
    }
    
    exerciseDropdown.disabled = false;
    exerciseDropdown.innerHTML = '<option value="">Select Exercise</option>';
    
    exerciseDatabase[muscleGroup].forEach(exercise => {
        const option = document.createElement('option');
        option.value = exercise;
        option.textContent = exercise;
        exerciseDropdown.appendChild(option);
    });
}

function removeExercise(btn) {
    btn.closest('.exercise-item').remove();
}

function saveWorkout() {
    const workoutName = document.getElementById('workoutName').value;
    if (!workoutName) {
        alert('Please enter a workout name');
        return;
    }
    
    const exercises = [];
    document.querySelectorAll('.exercise-item').forEach(item => {
        const name = item.querySelector('.exercise-name').value;
        const sets = parseInt(item.querySelector('.exercise-sets').value);
        const reps = parseInt(item.querySelector('.exercise-reps').value);
        const rest = parseInt(item.querySelector('.exercise-rest').value);
        
        if (name && sets && reps) {
            exercises.push({ name, sets, reps, rest: rest || 60 });
        }
    });
    
    if (exercises.length === 0) {
        alert('Please add at least one exercise');
        return;
    }
    
    const workout = {
        id: Date.now(),
        name: workoutName,
        exercises
    };
    
    workouts.push(workout);
    localStorage.setItem('workouts', JSON.stringify(workouts));
    
    document.getElementById('workoutName').value = '';
    document.getElementById('exerciseList').innerHTML = '';
    exerciseCount = 0;
    
    loadSavedWorkouts();
    speak('Workout saved successfully');
    alert('Workout saved!');
}

function loadSavedWorkouts() {
    const list = document.getElementById('savedWorkoutsList');
    list.innerHTML = '';
    
    workouts.forEach(workout => {
        const card = document.createElement('div');
        card.className = 'workout-card';
        card.innerHTML = `
            <h3>${workout.name}</h3>
            <p>${workout.exercises.length} exercises</p>
        `;
        card.onclick = () => startSavedWorkout(workout);
        list.appendChild(card);
    });
}

// Active Workout
function startWorkout() {
    if (workouts.length === 0) {
        alert('Please create a workout first!');
        showPage('workout');
        return;
    }
    
    startSavedWorkout(workouts[0]);
}

function startSavedWorkout(workout) {
    currentWorkout = {
        ...workout,
        startTime: Date.now(),
        completedSets: [],
        totalWeight: 0
    };
    
    workoutStartTime = Date.now();
    
    document.getElementById('activeWorkoutName').textContent = workout.name;
    showPage('activeWorkout');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    renderExerciseProgress();
    startWorkoutTimer();
    
    speak(`Starting ${workout.name}. Let's get it!`);
}

function renderExerciseProgress() {
    const container = document.getElementById('exerciseProgress');
    container.innerHTML = '';
    
    currentWorkout.exercises.forEach((exercise, exIndex) => {
        const exerciseDiv = document.createElement('div');
        exerciseDiv.className = 'exercise-progress-item';
        
        let setsHTML = '';
        for (let i = 0; i < exercise.sets; i++) {
            const setId = `${exIndex}-${i}`;
            const isCompleted = currentWorkout.completedSets.includes(setId);
            
            setsHTML += `
                <div class="set-row ${isCompleted ? 'completed' : ''}" id="set-${setId}">
                    <span>Set ${i + 1}</span>
                    <input type="number" placeholder="Weight (kg)" id="weight-${setId}" ${isCompleted ? 'disabled' : ''}>
                    <input type="number" placeholder="Reps" value="${exercise.reps}" id="reps-${setId}" ${isCompleted ? 'disabled' : ''}>
                    <button onclick="completeSet('${setId}', ${exIndex}, ${i})">${isCompleted ? '✓' : 'Done'}</button>
                </div>
            `;
        }
        
        exerciseDiv.innerHTML = `
            <h3>${exercise.name}</h3>
            ${setsHTML}
        `;
        
        container.appendChild(exerciseDiv);
    });
}

function completeSet(setId, exIndex, setNum) {
    if (currentWorkout.completedSets.includes(setId)) return;
    
    const weight = parseFloat(document.getElementById(`weight-${setId}`).value) || 0;
    const reps = parseInt(document.getElementById(`reps-${setId}`).value) || 0;
    
    currentWorkout.completedSets.push(setId);
    currentWorkout.totalWeight += weight * reps;
    
    document.getElementById(`set-${setId}`).classList.add('completed');
    document.getElementById(`weight-${setId}`).disabled = true;
    document.getElementById(`reps-${setId}`).disabled = true;
    
    const exercise = currentWorkout.exercises[exIndex];
    speak(`Set ${setNum + 1} complete. Great job!`);
    
    // Start rest timer
    if (setNum < exercise.sets - 1) {
        startRestTimer(exercise.rest);
    } else if (exIndex < currentWorkout.exercises.length - 1) {
        speak(`${exercise.name} complete. Moving to next exercise.`);
    } else {
        speak('Workout complete! Amazing work!');
        setTimeout(endWorkout, 2000);
    }
}

function startWorkoutTimer() {
    workoutTimerInterval = setInterval(() => {
        const elapsed = Date.now() - workoutStartTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        document.getElementById('workoutTimer').textContent = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
}

function startRestTimer(seconds) {
    let remaining = seconds;
    document.getElementById('restCountdown').textContent = remaining;
    document.getElementById('restTimer').classList.remove('hidden');
    
    speak(`Rest for ${seconds} seconds`);
    
    restTimerInterval = setInterval(() => {
        remaining--;
        document.getElementById('restCountdown').textContent = remaining;
        
        if (remaining <= 0) {
            skipRest();
            speak('Rest time over. Ready for the next set!');
        } else if (remaining === 3) {
            speak('3');
        } else if (remaining === 2) {
            speak('2');
        } else if (remaining === 1) {
            speak('1');
        }
    }, 1000);
}

function skipRest() {
    clearInterval(restTimerInterval);
    document.getElementById('restTimer').classList.add('hidden');
}

function endWorkout() {
    clearInterval(workoutTimerInterval);
    clearInterval(restTimerInterval);
    
    const duration = Math.floor((Date.now() - workoutStartTime) / 60000);
    
    workoutHistory.push({
        name: currentWorkout.name,
        date: new Date().toISOString(),
        duration,
        totalWeight: currentWorkout.totalWeight,
        exercises: currentWorkout.exercises.length
    });
    
    localStorage.setItem('workoutHistory', JSON.stringify(workoutHistory));
    
    currentWorkout = null;
    updateStats();
    loadWorkoutHistory();
    
    showPage('home');
    speak('Workout saved. Great session!');
}

// Progress Tracking
function saveMeasurement() {
    const weight = parseFloat(document.getElementById('weight').value);
    const bodyFat = parseFloat(document.getElementById('bodyFat').value);
    
    if (!weight) {
        alert('Please enter your weight');
        return;
    }
    
    measurements.push({
        date: new Date().toISOString(),
        weight,
        bodyFat: bodyFat || null
    });
    
    localStorage.setItem('measurements', JSON.stringify(measurements));
    
    document.getElementById('weight').value = '';
    document.getElementById('bodyFat').value = '';
    
    loadMeasurementHistory();
    speak('Measurement saved');
}

function loadMeasurementHistory() {
    const container = document.getElementById('measurementHistory');
    container.innerHTML = '';
    
    measurements.slice(-10).reverse().forEach(m => {
        const div = document.createElement('div');
        div.className = 'measurement-item';
        div.innerHTML = `
            <span>${new Date(m.date).toLocaleDateString()}</span>
            <span>${m.weight} kg ${m.bodyFat ? `| ${m.bodyFat}% BF` : ''}</span>
        `;
        container.appendChild(div);
    });
}

function loadWorkoutHistory() {
    const container = document.getElementById('workoutHistory');
    container.innerHTML = '';
    
    workoutHistory.slice(-10).reverse().forEach(w => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <h4>${w.name}</h4>
            <p>${new Date(w.date).toLocaleDateString()} | ${w.duration} min | ${Math.round(w.totalWeight)} kg lifted</p>
        `;
        container.appendChild(div);
    });
}

// Nutrition Tracking
function logMeal() {
    const name = document.getElementById('mealName').value;
    const calories = parseInt(document.getElementById('mealCalories').value);
    const protein = parseInt(document.getElementById('mealProtein').value);
    const carbs = parseInt(document.getElementById('mealCarbs').value);
    const fats = parseInt(document.getElementById('mealFats').value);
    
    if (!name || !calories) {
        alert('Please enter meal name and calories');
        return;
    }
    
    const today = new Date().toDateString();
    
    meals.push({
        date: today,
        name,
        calories,
        protein: protein || 0,
        carbs: carbs || 0,
        fats: fats || 0
    });
    
    localStorage.setItem('meals', JSON.stringify(meals));
    
    document.getElementById('mealName').value = '';
    document.getElementById('mealCalories').value = '';
    document.getElementById('mealProtein').value = '';
    document.getElementById('mealCarbs').value = '';
    document.getElementById('mealFats').value = '';
    
    loadMeals();
    speak('Meal logged');
}

function loadMeals() {
    const today = new Date().toDateString();
    const todayMeals = meals.filter(m => m.date === today);
    
    const totalCalories = todayMeals.reduce((sum, m) => sum + m.calories, 0);
    const totalProtein = todayMeals.reduce((sum, m) => sum + m.protein, 0);
    const totalCarbs = todayMeals.reduce((sum, m) => sum + m.carbs, 0);
    const totalFats = todayMeals.reduce((sum, m) => sum + m.fats, 0);
    
    document.getElementById('caloriesConsumed').textContent = totalCalories;
    document.getElementById('proteinConsumed').textContent = totalProtein;
    document.getElementById('carbsConsumed').textContent = totalCarbs;
    document.getElementById('fatsConsumed').textContent = totalFats;
    
    const container = document.getElementById('mealsList');
    container.innerHTML = '';
    
    todayMeals.reverse().forEach(m => {
        const div = document.createElement('div');
        div.className = 'meal-item';
        div.innerHTML = `
            <h4>${m.name}</h4>
            <div class="meal-macros">
                <span>${m.calories} cal</span>
                <span>P: ${m.protein}g</span>
                <span>C: ${m.carbs}g</span>
                <span>F: ${m.fats}g</span>
            </div>
        `;
        container.appendChild(div);
    });
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.log('SW registration failed'));
}