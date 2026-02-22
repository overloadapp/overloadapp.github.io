import { 
    auth, 
    googleProvider,
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signInWithPopup,
    sendPasswordResetEmail
} from './firebase-config.js';

// Get DOM elements
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const forgotPasswordForm = document.getElementById('forgot-password-form');
const googleLoginBtn = document.getElementById('google-login-btn');
const googleSignupBtn = document.getElementById('google-signup-btn');

const loginContainer = document.getElementById('login-form-container');
const signupContainer = document.getElementById('signup-form-container');
const forgotPasswordContainer = document.getElementById('forgot-password-container');

const showSignupLink = document.getElementById('show-signup');
const showLoginLink = document.getElementById('show-login');
const forgotPasswordLink = document.getElementById('forgot-password');
const backToLoginLink = document.getElementById('back-to-login');

const authLoading = document.getElementById('auth-loading');

// Show/hide loading
function showLoading() {
    authLoading.style.display = 'flex';
}

function hideLoading() {
    authLoading.style.display = 'none';
}

// Show different forms
function showLogin() {
    loginContainer.style.display = 'block';
    signupContainer.style.display = 'none';
    forgotPasswordContainer.style.display = 'none';
}

function showSignup() {
    loginContainer.style.display = 'none';
    signupContainer.style.display = 'block';
    forgotPasswordContainer.style.display = 'none';
}

function showForgotPassword() {
    loginContainer.style.display = 'none';
    signupContainer.style.display = 'none';
    forgotPasswordContainer.style.display = 'block';
}

// Event listeners for switching forms
showSignupLink.addEventListener('click', (e) => {
    e.preventDefault();
    showSignup();
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    showLogin();
});

forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    showForgotPassword();
});

backToLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    showLogin();
});

// Login with Email/Password
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('remember-me').checked;
    
    showLoading();
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Store remember me preference
        if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
        }
        
        // Redirect to main app
        window.location.href = 'index.html';
    } catch (error) {
        hideLoading();
        let errorMessage = 'Failed to sign in. ';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage += 'No account found with this email.';
                break;
            case 'auth/wrong-password':
                errorMessage += 'Incorrect password.';
                break;
            case 'auth/invalid-email':
                errorMessage += 'Invalid email address.';
                break;
            case 'auth/user-disabled':
                errorMessage += 'This account has been disabled.';
                break;
            default:
                errorMessage += error.message;
        }
        
        alert(errorMessage);
    }
});

// Sign up with Email/Password
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-password-confirm').value;
    
    // Validate passwords match
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    
    // Validate password length
    if (password.length < 6) {
        alert('Password must be at least 6 characters long.');
        return;
    }
    
    showLoading();
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Redirect to main app
        window.location.href = 'index.html';
    } catch (error) {
        hideLoading();
        let errorMessage = 'Failed to create account. ';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage += 'An account with this email already exists.';
                break;
            case 'auth/invalid-email':
                errorMessage += 'Invalid email address.';
                break;
            case 'auth/weak-password':
                errorMessage += 'Password is too weak.';
                break;
            default:
                errorMessage += error.message;
        }
        
        alert(errorMessage);
    }
});

// Google Sign In (both login and signup)
async function handleGoogleSignIn() {
    showLoading();
    
    try {
        const result = await signInWithPopup(auth, googleProvider);
        
        // Redirect to main app
        window.location.href = 'index.html';
    } catch (error) {
        hideLoading();
        let errorMessage = 'Failed to sign in with Google. ';
        
        switch (error.code) {
            case 'auth/popup-closed-by-user':
                errorMessage = 'Sign in cancelled.';
                break;
            case 'auth/popup-blocked':
                errorMessage += 'Please allow popups for this site.';
                break;
            case 'auth/account-exists-with-different-credential':
                errorMessage += 'An account already exists with the same email.';
                break;
            default:
                errorMessage += error.message;
        }
        
        alert(errorMessage);
    }
}

googleLoginBtn.addEventListener('click', handleGoogleSignIn);
googleSignupBtn.addEventListener('click', handleGoogleSignIn);

// Forgot Password
forgotPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('reset-email').value;
    
    showLoading();
    
    try {
        await sendPasswordResetEmail(auth, email);
        hideLoading();
        alert('Password reset email sent! Check your inbox.');
        showLogin();
        forgotPasswordForm.reset();
    } catch (error) {
        hideLoading();
        let errorMessage = 'Failed to send reset email. ';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage += 'No account found with this email.';
                break;
            case 'auth/invalid-email':
                errorMessage += 'Invalid email address.';
                break;
            default:
                errorMessage += error.message;
        }
        
        alert(errorMessage);
    }
});
