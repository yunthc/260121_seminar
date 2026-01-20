// src/indexMain.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// firebaseConfig.js에서 설정 가져오기 (사용자가 직접 생성해야 함)
import { firebaseConfig } from "./firebaseConfig.js";

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// DOM 요소 선택
const loginView = document.getElementById('login-view');
const appView = document.getElementById('app-view');
const loginBtn = document.getElementById('google-login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userGreeting = document.getElementById('user-greeting');

// 로그인 처리 함수
const handleLogin = async () => {
    try {
        await signInWithPopup(auth, provider);
        // 로그인 성공 시 onAuthStateChanged가 자동으로 감지함
    } catch (error) {
        console.error("Login Failed:", error);
        alert("로그인 중 오류가 발생했습니다.");
    }
};

// 로그아웃 처리 함수
const handleLogout = async () => {
    try {
        await signOut(auth);
        alert("로그아웃 되었습니다.");
    } catch (error) {
        console.error("Logout Failed:", error);
    }
};

// UI 업데이트 함수
const updateUI = (user) => {
    if (user) {
        // 로그인 상태
        loginView.classList.add('hidden');
        appView.classList.remove('hidden');
        userGreeting.textContent = `${user.displayName}님, 환영합니다!`;
    } else {
        // 비로그인 상태
        loginView.classList.remove('hidden');
        appView.classList.add('hidden');
    }
};

// 이벤트 리스너 등록
loginBtn.addEventListener('click', handleLogin);
logoutBtn.addEventListener('click', handleLogout);

// 인증 상태 변화 감지 (핵심 로직)
onAuthStateChanged(auth, (user) => {
    updateUI(user);
});