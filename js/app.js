import { exercises } from './data.js';
import { db, collection, addDoc, getDocs, query, where, orderBy, doc, setDoc, deleteDoc, updateDoc, getDoc } from './firebase-config.js';
import { auth, onAuthStateChanged, signOut } from './firebase-config.js';
import { drawSmoothLineChart } from './chart.js';

// --- State ---
let currentUser = null;
let currentExerciseId = null;
let allLogs = [];
let currentFilters = { muscle: 'all', equipment: 'all' };
let allWorkouts = [];
let currentWorkoutId = null;
let currentEditDayInfo = null;
let currentAddToWorkoutExerciseId = null;
let previousView = 'library'; // Track where we came from

// --- Auth Check ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        currentUser = user;
        console.log('User authenticated:', user.email);
        initApp();
    } else {
        // No user is signed in, redirect to auth page
        window.location.href = 'auth.html';
    }
});

// --- Init ---
function initApp() {
    initHero();
    initScrollAnimations();
    initNavigation();
    initMobileMenu();
    initTheme();
    initFilters();
    renderLibrary();
    initForms();
    fetchAllLogs(); // For Dashboard
    fetchAllWorkouts(); // For Workouts
    initWorkoutForms();
    initLogout();
    updateUserProfile();
}

// --- Hero Section ---
function initHero() {
    const heroSection = document.getElementById('hero');
    const getStartedBtn = document.getElementById('get-started-btn');
    const heroCTABtn = document.getElementById('hero-cta-btn');
    
    function hideHero() {
        if (heroSection) {
            heroSection.classList.add('hidden');
        }
    }
    
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', hideHero);
    }
    
    if (heroCTABtn) {
        heroCTABtn.addEventListener('click', hideHero);
    }
}

// --- Scroll Animations ---
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Unobserve after animation to improve performance
                scrollObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Function to observe elements with debouncing
    let observeTimeout;
    window.observeScrollElements = function() {
        clearTimeout(observeTimeout);
        observeTimeout = setTimeout(() => {
            const animatedElements = document.querySelectorAll('.exercise-card, .stat-card, .activity-item, .workout-card');
            animatedElements.forEach(el => {
                if (!el.classList.contains('scroll-fade-in') && !el.classList.contains('visible')) {
                    el.classList.add('scroll-fade-in');
                    scrollObserver.observe(el);
                }
            });
        }, 50);
    };
    
    // Initial observation
    window.observeScrollElements();
}

// --- Theme ---
function initTheme() {
    // Dark theme is now the only theme - no toggle needed
}

// --- Logout ---
function initLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to log out?')) {
                try {
                    await signOut(auth);
                    // Redirect handled by onAuthStateChanged
                } catch (error) {
                    console.error('Logout error:', error);
                    showToast('Failed to log out. Please try again.', 'error');
                }
            }
        });
    }
}

// --- User Profile ---
function updateUserProfile() {
    const userProfile = document.querySelector('.user-profile');
    if (!userProfile || !currentUser) return;
    
    const email = currentUser.email;
    const displayName = currentUser.displayName || email.split('@')[0];
    const initials = displayName.substring(0, 2).toUpperCase();
    
    userProfile.innerHTML = `
        <div class="user-info">
            <div class="user-avatar">${initials}</div>
            <div class="user-details">
                <h4>${displayName}</h4>
                <p>${email}</p>
            </div>
        </div>
        <button id="logout-btn" class="logout-btn">Sign Out</button>
    `;
    
    // Re-attach logout listener
    initLogout();
}

// --- Navigation ---
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-links li');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Get the li element, even if we clicked on a child element (icon or text)
            const clickedLink = e.currentTarget;
            const targetView = clickedLink.dataset.target;
            
            // Only proceed if there's a valid target
            if (!targetView) return;
            
            // Update active state
            navLinks.forEach(l => l.classList.remove('active'));
            clickedLink.classList.add('active');
            
            // Show the view
            showView(targetView);
            
            // Close mobile menu when a link is clicked
            closeMobileMenu();
        });
    });

    document.getElementById('back-btn').addEventListener('click', () => {
        showView(previousView);
    });

    document.getElementById('log-date').valueAsDate = new Date();
}

// --- Mobile Menu ---
function closeMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const mobileOverlay = document.getElementById('mobile-overlay');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    
    if (sidebar) sidebar.classList.remove('mobile-active');
    if (mobileOverlay) mobileOverlay.classList.remove('active');
    if (mobileMenuBtn) mobileMenuBtn.classList.remove('active');
    document.body.style.overflow = '';
}

function openMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const mobileOverlay = document.getElementById('mobile-overlay');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    
    if (sidebar) sidebar.classList.add('mobile-active');
    if (mobileOverlay) mobileOverlay.classList.add('active');
    if (mobileMenuBtn) mobileMenuBtn.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileOverlay = document.getElementById('mobile-overlay');
    const sidebar = document.querySelector('.sidebar');
    
    if (!mobileMenuBtn || !mobileOverlay || !sidebar) return;
    
    // Toggle menu when button is clicked
    mobileMenuBtn.addEventListener('click', () => {
        const isActive = sidebar.classList.contains('mobile-active');
        if (isActive) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    });
    
    // Close menu when overlay is clicked
    mobileOverlay.addEventListener('click', closeMobileMenu);
}

// Make closeMobileMenu available globally
window.closeMobileMenu = closeMobileMenu;

function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active-view'));
    document.getElementById(viewId).classList.add('active-view');
    if (viewId === 'dashboard') updateDashboard();
}

// --- Filters ---
function initFilters() {
    const muscleFilter = document.getElementById('muscle-filter');
    const equipmentFilter = document.getElementById('equipment-filter');
    
    // Populate muscle group filter
    const muscleGroups = [...new Set(exercises.map(ex => ex.muscleGroup))].sort();
    muscleGroups.forEach(muscle => {
        const option = document.createElement('option');
        option.value = muscle;
        option.textContent = muscle;
        muscleFilter.appendChild(option);
    });
    
    // Populate equipment filter
    const equipmentTypes = [...new Set(exercises.map(ex => ex.equipment))].sort();
    equipmentTypes.forEach(equipment => {
        const option = document.createElement('option');
        option.value = equipment;
        option.textContent = equipment;
        equipmentFilter.appendChild(option);
    });
    
    // Add event listeners
    muscleFilter.addEventListener('change', (e) => {
        currentFilters.muscle = e.target.value;
        renderLibrary();
    });
    
    equipmentFilter.addEventListener('change', (e) => {
        currentFilters.equipment = e.target.value;
        renderLibrary();
    });
}

function getFilteredExercises() {
    return exercises.filter(ex => {
        const matchesMuscle = currentFilters.muscle === 'all' || ex.muscleGroup === currentFilters.muscle;
        const matchesEquipment = currentFilters.equipment === 'all' || ex.equipment === currentFilters.equipment;
        return matchesMuscle && matchesEquipment;
    });
}

// --- UI Rendering ---
function renderLibrary() {
    const grid = document.getElementById('exercise-grid');
    const select = document.getElementById('quick-log-exercise');
    grid.innerHTML = ''; select.innerHTML = '';
    
    const filteredExercises = getFilteredExercises();
    
    filteredExercises.forEach(ex => {
        // Render Card
        const card = document.createElement('div');
        card.className = 'exercise-card';
        card.innerHTML = `
            <div class="exercise-image-wrapper">
                <img class="exercise-card-image" 
                     data-src="${ex.image}" 
                     alt="${ex.name}" 
                     loading="lazy"
                     onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22%3E%3Crect width=%22100%25%22 height=%22100%25%22 fill=%22%231a1a24%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23718096%22 font-size=%2224%22 font-family=%22Arial%22%3ENo Image%3C/text%3E%3C/svg%3E';">
            </div>
            <div class="exercise-card-content">
                <h3>${ex.name}</h3>
                <div class="exercise-card-meta">
                    <span>💪 ${ex.muscleGroup}</span>
                    <span>🏋️ ${ex.equipment}</span>
                </div>
                <button class="btn secondary-btn" onclick="event.stopPropagation(); app.addToWorkout('${ex.id}')" style="width: 100%; margin-top: 1rem; font-size: 0.875rem;">+ Add to Workout</button>
            </div>
        `;
        card.addEventListener('click', () => openExerciseDetail(ex));
        grid.appendChild(card);
    });
    
    // Implement Intersection Observer for lazy loading
    lazyLoadImages();
    
    // Populate Quick Add Select with all exercises (no filtering here)
    exercises.forEach(ex => {
        const option = document.createElement('option');
        option.value = ex.id;
        option.textContent = ex.name;
        select.appendChild(option);
    });
    
    // Trigger scroll animations
    if (window.observeScrollElements) {
        setTimeout(() => window.observeScrollElements(), 100);
    }
}

// --- Exercise Detail & Firebase Fetching ---
async function openExerciseDetail(exercise, fromView = 'library') {
    currentExerciseId = exercise.id;
    previousView = fromView; // Remember where we came from
    document.getElementById('detail-title').textContent = exercise.name;
    document.getElementById('detail-muscle').textContent = exercise.muscleGroup;
    document.getElementById('detail-image').src = exercise.image;
    
    showView('exercise-detail');
    await fetchExerciseData(currentExerciseId, 'all');
}

async function fetchExerciseData(exerciseId, daysFilter) {
    if (!currentUser) return;
    
    const q = query(collection(db, `users/${currentUser.uid}/exerciseLogs`), where("exerciseId", "==", exerciseId));
    const querySnapshot = await getDocs(q);
    
    let logs = [];
    querySnapshot.forEach((doc) => logs.push(doc.data()));
    
    // Sort by date
    logs.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Filter by days
    if (daysFilter !== 'all') {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - parseInt(daysFilter));
        logs = logs.filter(log => new Date(log.date) >= cutoff);
    }

    updateStatsAndGraph(logs);
}

function updateStatsAndGraph(logs) {
    if (logs.length === 0) {
        drawSmoothLineChart('progress-chart', []);
        document.getElementById('stat-avg').textContent = '0 kg';
        document.getElementById('stat-max').textContent = '0 kg';
        document.getElementById('stat-sessions').textContent = '0';
        document.getElementById('stat-1rm').textContent = '0 kg';
        return;
    }

    const weights = logs.map(l => Number(l.weight));
    const maxWeight = Math.max(...weights);
    const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
    
    // Calculate simple estimated 1RM (Epley formula based on best set)
    const bestLog = logs.reduce((prev, current) => (Number(prev.weight) > Number(current.weight)) ? prev : current);
    const est1RM = bestLog.weight * (1 + bestLog.reps / 30);

    document.getElementById('stat-avg').textContent = `${avgWeight.toFixed(1)} kg`;
    document.getElementById('stat-max').textContent = `${maxWeight} kg`;
    document.getElementById('stat-sessions').textContent = logs.length;
    document.getElementById('stat-1rm').textContent = `${est1RM.toFixed(1)} kg`;

    drawSmoothLineChart('progress-chart', logs);
}

// --- Forms & Saving to Firestore ---
function initForms() {
    // Detail Form
    document.getElementById('log-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const weight = document.getElementById('log-weight').value;
        const reps = document.getElementById('log-reps').value;
        const sets = document.getElementById('log-sets').value;
        const date = document.getElementById('log-date').value;

        await saveLog(currentExerciseId, weight, reps, sets, date);
        e.target.reset();
        document.getElementById('log-date').valueAsDate = new Date();
        await fetchExerciseData(currentExerciseId, 'all'); // Refresh
        fetchAllLogs(); // Update dashboard
    });

    // Graph Filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            fetchExerciseData(currentExerciseId, e.target.dataset.days);
        });
    });

    // Quick Add Modal
    const modal = document.getElementById('quick-add-modal');
    document.getElementById('quick-add-btn').onclick = () => modal.style.display = 'flex';
    document.querySelector('.close-modal').onclick = () => modal.style.display = 'none';
    window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; }

    document.getElementById('quick-log-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const exId = document.getElementById('quick-log-exercise').value;
        const weight = document.getElementById('quick-log-weight').value;
        const reps = document.getElementById('quick-log-reps').value;
        const sets = document.getElementById('quick-log-sets').value;
        const date = new Date().toISOString().split('T')[0];

        await saveLog(exId, weight, reps, sets, date);
        e.target.reset();
        modal.style.display = 'none';
        fetchAllLogs(); // Refresh dashboard
    });
}

async function saveLog(exerciseId, weight, reps, sets, date) {
    if (!currentUser) {
        showToast('You must be logged in to save progress.', 'warning');
        return;
    }
    
    try {
        await addDoc(collection(db, `users/${currentUser.uid}/exerciseLogs`), {
            exerciseId,
            weight: Number(weight),
            reps: Number(reps),
            sets: Number(sets),
            date: date, // Storing as YYYY-MM-DD string for easy vanilla JS sorting
            timestamp: Date.now()
        });
        showToast('Progress saved successfully! 💪', 'success');
    } catch (e) {
        console.error("Error adding document: ", e);
        showToast('Failed to save progress. Please try again.', 'error');
    }
}

// --- Dashboard ---
async function fetchAllLogs() {
    if (!currentUser) return;
    
    const querySnapshot = await getDocs(collection(db, `users/${currentUser.uid}/exerciseLogs`));
    allLogs = [];
    querySnapshot.forEach((doc) => allLogs.push(doc.data()));
    updateDashboard();
}

function updateDashboard() {
    if(!document.getElementById('dashboard').classList.contains('active-view')) return;

    document.getElementById('dash-total-workouts').textContent = allLogs.length;

    // Find most trained muscle
    const muscleCounts = {};
    allLogs.forEach(log => {
        const ex = exercises.find(e => e.id === log.exerciseId);
        if(ex) {
            muscleCounts[ex.muscleGroup] = (muscleCounts[ex.muscleGroup] || 0) + 1;
        }
    });
    
    let mostTrained = '-';
    let max = 0;
    for (const [muscle, count] of Object.entries(muscleCounts)) {
        if (count > max) { max = count; mostTrained = muscle; }
    }
    document.getElementById('dash-most-trained').textContent = mostTrained;

    // Recent Activity (Last 5)
    const recentList = document.getElementById('recent-activity-list');
    recentList.innerHTML = '';
    
    const sortedLogs = [...allLogs].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
    
    if (sortedLogs.length === 0) {
        recentList.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-tertiary);">No recent activity. Start logging your workouts!</div>';
        return;
    }
    
    sortedLogs.forEach(log => {
        const ex = exercises.find(e => e.id === log.exerciseId);
        if(!ex) return;
        
        const div = document.createElement('div');
        div.className = 'activity-item';
        div.innerHTML = `
            <div class="activity-info">
                <h4>${ex.name}</h4>
                <p>${log.date} • ${log.sets} sets</p>
            </div>
            <div class="activity-stats">
                <div class="activity-weight">${log.weight}kg</div>
                <div class="activity-reps">${log.reps} reps</div>
            </div>
        `;
        recentList.appendChild(div);
    });
    
    // Trigger scroll animations
    if (window.observeScrollElements) {
        setTimeout(() => window.observeScrollElements(), 100);
    }
}

// ===================================
// WORKOUTS FUNCTIONALITY
// ===================================

// --- Fetch All Workouts ---
async function fetchAllWorkouts() {
    if (!currentUser) return;
    
    try {
        const workoutsSnapshot = await getDocs(collection(db, `users/${currentUser.uid}/workouts`));
        allWorkouts = workoutsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderWorkouts();
    } catch (error) {
        console.error('Error fetching workouts:', error);
    }
}

// --- Render Workouts List ---
function renderWorkouts() {
    const workoutsList = document.getElementById('workouts-list');
    workoutsList.innerHTML = '';

    if (allWorkouts.length === 0) {
        workoutsList.innerHTML = `
            <div class="no-workouts-message" style="text-align: center; padding: 3rem; color: var(--text-tertiary);">
                <p style="font-size: 1.125rem; margin-bottom: 0.5rem;">You haven't created any workout programs yet.</p>
                <p>Click the "Create Workout" button above to get started!</p>
            </div>
        `;
        return;
    }

    allWorkouts.forEach(workout => {
        const card = document.createElement('div');
        card.className = 'workout-card';
        card.innerHTML = `
            <h3>${workout.name}</h3>
            <p>${workout.daysPerWeek} days per week</p>
        `;
        card.onclick = () => showWorkoutDetail(workout.id);
        workoutsList.appendChild(card);
    });
    
    // Trigger scroll animations
    if (window.observeScrollElements) {
        setTimeout(() => window.observeScrollElements(), 100);
    }
}

// --- Show Workout Detail ---
async function showWorkoutDetail(workoutId) {
    currentWorkoutId = workoutId;
    const workout = allWorkouts.find(w => w.id === workoutId);
    
    document.getElementById('workout-detail-title').textContent = workout.name;
    showView('workout-detail');
    
    renderWorkoutDays(workout);
}

// --- Render Workout Days ---
function renderWorkoutDays(workout) {
    const container = document.getElementById('workout-days-container');
    container.innerHTML = '';

    for (let i = 1; i <= workout.daysPerWeek; i++) {
        const dayKey = `day${i}`;
        const dayData = workout.days?.[dayKey] || { name: `Day ${i}`, exercises: [] };
        
        const dayCard = document.createElement('div');
        dayCard.className = 'workout-day-card';
        dayCard.innerHTML = `
            <div class="workout-day-header">
                <h3 onclick="app.editDayName('${workout.id}', '${dayKey}', '${dayData.name}')">${dayData.name}</h3>
                <span style="color: var(--text-muted); font-size: 0.9rem;">${dayData.exercises?.length || 0} exercises</span>
            </div>
            <div class="workout-exercises-list" id="exercises-${dayKey}">
                ${renderDayExercises(dayData.exercises || [])}
            </div>
        `;
        container.appendChild(dayCard);
    }
}

// --- Render Day Exercises ---
function renderDayExercises(exerciseIds) {
    if (!exerciseIds || exerciseIds.length === 0) {
        return '<div class="empty-day-message">No exercises added yet. Add exercises from the Exercise Library!</div>';
    }

    const html = exerciseIds.map(exId => {
        const exercise = exercises.find(e => e.id === exId);
        if (!exercise) return '';
        
        return `
            <div class="workout-exercise-card" onclick="app.showExerciseDetailFromWorkout('${exId}')">
                <img data-src="${exercise.image}" 
                     alt="${exercise.name}" 
                     loading="lazy"
                     onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect width=%22100%25%22 height=%22100%25%22 fill=%22%231a1a24%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23718096%22 font-size=%2216%22%3ENo Image%3C/text%3E%3C/svg%3E';">
                <div class="workout-exercise-info">
                    <h4>${exercise.name}</h4>
                    <span class="badge">${exercise.muscleGroup}</span>
                </div>
                <button class="remove-exercise-btn" onclick="event.stopPropagation(); app.removeExerciseFromDay('${currentWorkoutId}', '${exId}')">✕</button>
            </div>
        `;
    }).join('');
    
    // Re-apply lazy loading to newly added images
    setTimeout(lazyLoadImages, 100);
    
    return html;
}

// --- Lazy Load Images ---
function lazyLoadImages() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const src = img.getAttribute('data-src');
                if (src) {
                    img.src = src;
                    img.removeAttribute('data-src');
                    img.classList.add('loaded');
                }
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px' // Start loading 50px before image enters viewport
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// --- Initialize Workout Forms ---
function initWorkoutForms() {
    // Create Workout Button
    document.getElementById('create-workout-btn')?.addEventListener('click', () => {
        openModal('create-workout-modal');
    });

    // Create Workout Form
    document.getElementById('create-workout-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('workout-name').value;
        const daysPerWeek = parseInt(document.getElementById('days-per-week').value);
        
        await createWorkout(name, daysPerWeek);
        
        document.getElementById('create-workout-form').reset();
        closeModal('create-workout-modal');
    });

    // Back to Workouts Button
    document.getElementById('back-to-workouts-btn')?.addEventListener('click', () => {
        showView('workouts');
    });

    // Delete Workout Button
    document.getElementById('delete-workout-btn')?.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete this workout program?')) {
            await deleteWorkout(currentWorkoutId);
            showView('workouts');
        }
    });

    // Edit Day Name Form
    document.getElementById('edit-day-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newName = document.getElementById('day-name-input').value;
        await updateDayName(currentEditDayInfo.workoutId, currentEditDayInfo.dayKey, newName);
        closeModal('edit-day-modal');
    });

    // Modal Close Buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) closeModal(modal.id);
        });
    });
}

// --- Create Workout ---
async function createWorkout(name, daysPerWeek) {
    if (!currentUser) return;
    
    try {
        const days = {};
        for (let i = 1; i <= daysPerWeek; i++) {
            days[`day${i}`] = { name: `Day ${i}`, exercises: [] };
        }

        const workoutData = {
            name,
            daysPerWeek,
            days,
            createdAt: new Date().toISOString()
        };

        const docRef = await addDoc(collection(db, `users/${currentUser.uid}/workouts`), workoutData);
        allWorkouts.push({ id: docRef.id, ...workoutData });
        renderWorkouts();
        showToast('Workout created successfully! 🎯', 'success');
    } catch (error) {
        console.error('Error creating workout:', error);
        showToast('Failed to create workout. Please try again.', 'error');
    }
}

// --- Delete Workout ---
async function deleteWorkout(workoutId) {
    if (!currentUser) return;
    
    try {
        await deleteDoc(doc(db, `users/${currentUser.uid}/workouts`, workoutId));
        allWorkouts = allWorkouts.filter(w => w.id !== workoutId);
        renderWorkouts();
        showToast('Workout deleted successfully!', 'success');
    } catch (error) {
        console.error('Error deleting workout:', error);
        showToast('Failed to delete workout. Please try again.', 'error');
    }
}

// --- Edit Day Name ---
function editDayName(workoutId, dayKey, currentName) {
    currentEditDayInfo = { workoutId, dayKey };
    document.getElementById('day-name-input').value = currentName;
    openModal('edit-day-modal');
}

// --- Update Day Name ---
async function updateDayName(workoutId, dayKey, newName) {
    if (!currentUser) return;
    
    try {
        const workout = allWorkouts.find(w => w.id === workoutId);
        if (!workout) return;

        workout.days[dayKey].name = newName;

        await updateDoc(doc(db, `users/${currentUser.uid}/workouts`, workoutId), {
            [`days.${dayKey}.name`]: newName
        });

        renderWorkoutDays(workout);
    } catch (error) {
        console.error('Error updating day name:', error);
        showToast('Failed to update day name. Please try again.', 'error');
    }
}

// --- Add Exercise to Workout (from Library) ---
function addToWorkout(exerciseId) {
    currentAddToWorkoutExerciseId = exerciseId;
    renderWorkoutDaySelector();
    openModal('add-to-workout-modal');
}

// --- Render Workout Day Selector ---
function renderWorkoutDaySelector() {
    const container = document.getElementById('workout-day-selector');
    
    if (allWorkouts.length === 0) {
        container.innerHTML = `
            <div class="no-workouts-message">
                <p>You haven't created any workout programs yet.</p>
                <p>Go to the "My Workouts" tab to create one first!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = allWorkouts.map(workout => `
        <div class="workout-selector-item">
            <div class="workout-selector-header">${workout.name}</div>
            <div class="workout-days-grid">
                ${Array.from({ length: workout.daysPerWeek }, (_, i) => {
                    const dayKey = `day${i + 1}`;
                    const dayName = workout.days?.[dayKey]?.name || `Day ${i + 1}`;
                    return `
                        <button class="day-selector-btn" onclick="app.addExerciseToDay('${workout.id}', '${dayKey}')">
                            ${dayName}
                        </button>
                    `;
                }).join('')}
            </div>
        </div>
    `).join('');
}

// --- Add Exercise to Day ---
async function addExerciseToDay(workoutId, dayKey) {
    if (!currentUser) return;
    
    try {
        const workout = allWorkouts.find(w => w.id === workoutId);
        if (!workout) return;

        if (!workout.days[dayKey].exercises) {
            workout.days[dayKey].exercises = [];
        }

        if (workout.days[dayKey].exercises.includes(currentAddToWorkoutExerciseId)) {
            showToast('This exercise is already in this day!', 'warning');
            return;
        }

        workout.days[dayKey].exercises.push(currentAddToWorkoutExerciseId);

        await updateDoc(doc(db, `users/${currentUser.uid}/workouts`, workoutId), {
            [`days.${dayKey}.exercises`]: workout.days[dayKey].exercises
        });

        closeModal('add-to-workout-modal');
        showToast('Exercise added to workout! 🏋️', 'success');
        
        // Refresh if we're viewing this workout
        if (currentWorkoutId === workoutId) {
            renderWorkoutDays(workout);
        }
    } catch (error) {
        console.error('Error adding exercise to day:', error);
        showToast('Failed to add exercise. Please try again.', 'error');
    }
}

// --- Remove Exercise from Day ---
async function removeExerciseFromDay(workoutId, exerciseId) {
    if (!currentUser) return;
    
    try {
        const workout = allWorkouts.find(w => w.id === workoutId);
        if (!workout) return;

        // Find which day has this exercise
        for (const [dayKey, dayData] of Object.entries(workout.days)) {
            if (dayData.exercises?.includes(exerciseId)) {
                dayData.exercises = dayData.exercises.filter(id => id !== exerciseId);
                
                await updateDoc(doc(db, `users/${currentUser.uid}/workouts`, workoutId), {
                    [`days.${dayKey}.exercises`]: dayData.exercises
                });
                
                renderWorkoutDays(workout);
                return;
            }
        }
    } catch (error) {
        console.error('Error removing exercise:', error);
        showToast('Failed to remove exercise. Please try again.', 'error');
    }
}

// --- Modal Helpers ---
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

// --- Expose functions to global scope for onclick handlers ---
function showExerciseDetail(exerciseId) {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (exercise) openExerciseDetail(exercise, 'library');
}

function showExerciseDetailFromWorkout(exerciseId) {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (exercise) openExerciseDetail(exercise, 'workout-detail');
}

// --- Toast Notification System ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const titles = {
        success: 'Success!',
        error: 'Error!',
        info: 'Info',
        warning: 'Warning!'
    };
    
    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
        warning: '⚠'
    };
    
    toast.innerHTML = `
        <div class="toast-header">
            <div class="toast-icon-wrapper">
                ${icons[type]}
            </div>
            <div class="toast-content">
                <div class="toast-title">${titles[type]}</div>
                <div class="toast-message">${message}</div>
            </div>
            <div class="toast-close" onclick="this.parentElement.parentElement.remove()">
                ✕
            </div>
        </div>
        <div class="toast-progress">
            <div class="toast-progress-bar"></div>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

window.app = {
    showView,
    showExerciseDetail,
    showExerciseDetailFromWorkout,
    editDayName,
    addExerciseToDay,
    removeExerciseFromDay,
    addToWorkout,
    closeModal,
    showToast
};