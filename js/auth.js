import { 
    auth, 
    db,
    googleProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    doc,
    setDoc,
    getDoc
} from './firebase-config.js';

// Get DOM elements
const googleLoginBtn = document.getElementById('google-login-btn');
const loginContainer = document.getElementById('login-form-container');
const awaitingApprovalContainer = document.getElementById('awaiting-approval-container');
const approvedSuccessContainer = document.getElementById('approved-success-container');
const signOutPendingBtn = document.getElementById('sign-out-pending-btn');
const enterAppBtn = document.getElementById('enter-app-btn');
const authLoading = document.getElementById('auth-loading');

// Show/hide loading
function showLoading() {
    authLoading.style.display = 'flex';
}

function hideLoading() {
    authLoading.style.display = 'none';
}

// Show awaiting approval screen
function showAwaitingApproval(user) {
    loginContainer.style.display = 'none';
    awaitingApprovalContainer.style.display = 'block';
    approvedSuccessContainer.style.display = 'none';
    document.getElementById('pending-user-email').textContent = user.email;
}

// Show approval success screen
function showApprovalSuccess() {
    loginContainer.style.display = 'none';
    awaitingApprovalContainer.style.display = 'none';
    approvedSuccessContainer.style.display = 'block';
}

// Show login screen
function showLogin() {
    loginContainer.style.display = 'block';
    awaitingApprovalContainer.style.display = 'none';
    approvedSuccessContainer.style.display = 'none';
}

// Check if user is approved and if they've seen the welcome screen
async function checkUserApproval(user) {
    try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            // New user - create document with pending status
            await setDoc(userDocRef, {
                email: user.email,
                displayName: user.displayName || '',
                photoURL: user.photoURL || '',
                approved: false,
                seenWelcome: false,
                createdAt: new Date().toISOString(),
                requestedAt: new Date().toISOString()
            });
            return { approved: false, seenWelcome: false };
        }
        
        const data = userDoc.data();
        return { 
            approved: data.approved === true,
            seenWelcome: data.seenWelcome === true
        };
    } catch (error) {
        console.error('Error checking user approval:', error);
        return { approved: false, seenWelcome: false };
    }
}

// Mark welcome screen as seen
async function markWelcomeSeen(user) {
    try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { seenWelcome: true }, { merge: true });
    } catch (error) {
        console.error('Error marking welcome as seen:', error);
    }
}

// Auth State Observer
onAuthStateChanged(auth, async (user) => {
    hideLoading();
    
    if (user) {
        showLoading();
        
        // Check if user is approved and if they've seen the welcome screen
        const { approved, seenWelcome } = await checkUserApproval(user);
        
        hideLoading();
        
        if (approved) {
            if (!seenWelcome) {
                // First time approved - show celebration screen
                showApprovalSuccess();
            } else {
                // Already seen welcome - go straight to app
                window.location.href = 'app.html';
            }
        } else {
            // Not approved - show waiting screen
            showAwaitingApproval(user);
        }
    } else {
        // Not logged in - show login screen
        showLogin();
    }
});

// Google Sign-In
if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', async () => {
        showLoading();
        
        try {
            await signInWithPopup(auth, googleProvider);
            // Auth state observer will handle the rest
        } catch (error) {
            hideLoading();
            console.error('Google sign-in error:', error);
            
            let errorMessage = 'Failed to sign in with Google. ';
            
            switch (error.code) {
                case 'auth/popup-closed-by-user':
                    errorMessage = 'Sign-in popup was closed. Please try again.';
                    break;
                case 'auth/cancelled-popup-request':
                    // User cancelled, no need to show error
                    return;
                case 'auth/popup-blocked':
                    errorMessage = 'Sign-in popup was blocked by your browser. Please allow popups and try again.';
                    break;
                default:
                    errorMessage += error.message;
            }
            
            alert(errorMessage);
        }
    });
}

// Sign out from pending screen
if (signOutPendingBtn) {
    signOutPendingBtn.addEventListener('click', async () => {
        showLoading();
        try {
            await signOut(auth);
            showLogin();
        } catch (error) {
            console.error('Sign out error:', error);
            alert('Failed to sign out. Please try again.');
        }
        hideLoading();
    });
}

// Enter app from approval success screen
if (enterAppBtn) {
    enterAppBtn.addEventListener('click', async () => {
        showLoading();
        try {
            // Mark welcome as seen
            await markWelcomeSeen(auth.currentUser);
            // Redirect to app
            window.location.href = 'app.html';
        } catch (error) {
            console.error('Error entering app:', error);
            // Even if marking fails, still let them in
            window.location.href = 'app.html';
        }
    });
}
